import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import Stripe from "npm:stripe@14.18.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get the JWT token from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Verify the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid token or user not found");
    }

    // Parse the request body
    const { clientId } = await req.json();

    // If clientId is 'current', use the authenticated user's ID
    const actualClientId = clientId === 'current' ? user.id : clientId;

    // Get the Stripe customer ID for this client
    const { data: customerData, error: customerError } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("client_id", actualClientId)
      .single();

    if (customerError) {
      // If no customer record exists, return empty payment methods
      if (customerError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ payment_methods: [] }),
          {
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            },
          }
        );
      }
      throw new Error(`Error fetching Stripe customer: ${customerError.message}`);
    }

    // Get payment methods for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerData.customer_id,
      type: "card",
    });

    // Get the default payment method
    const customer = await stripe.customers.retrieve(customerData.customer_id);
    const defaultPaymentMethodId = typeof customer !== 'string' ? customer.invoice_settings?.default_payment_method : null;

    // Mark default payment method
    const paymentMethodsWithDefault = paymentMethods.data.map(method => ({
      ...method,
      is_default: method.id === defaultPaymentMethodId,
    }));

    return new Response(
      JSON.stringify({ 
        payment_methods: paymentMethodsWithDefault 
      }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      }
    );
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      }
    );
  }
});