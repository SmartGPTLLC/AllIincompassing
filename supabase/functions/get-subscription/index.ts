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
      // If no customer record exists, return null subscription
      if (customerError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ subscription: null }),
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

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerData.customer_id,
      status: 'active',
      expand: ['data.default_payment_method', 'data.items.data.price.product'],
      limit: 1,
    });

    const subscription = subscriptions.data.length > 0 ? subscriptions.data[0] : null;

    return new Response(
      JSON.stringify({ subscription }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      }
    );
  } catch (error) {
    console.error("Error fetching subscription:", error);
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