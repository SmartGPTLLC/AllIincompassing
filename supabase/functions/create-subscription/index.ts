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
    const { priceId, clientId, paymentMethodId } = await req.json();

    if (!priceId) {
      throw new Error("Price ID is required");
    }

    // If clientId is 'current', use the authenticated user's ID
    const actualClientId = clientId === 'current' ? user.id : clientId;

    // Get client details from the database
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("email, full_name")
      .eq("id", actualClientId)
      .single();

    if (clientError) {
      throw new Error(`Error fetching client: ${clientError.message}`);
    }

    // Check if client already has a Stripe customer ID
    let customerId;
    const { data: customerData, error: customerError } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("client_id", actualClientId)
      .single();

    if (customerError && customerError.code !== "PGRST116") {
      throw new Error(`Error fetching Stripe customer: ${customerError.message}`);
    }

    if (customerData?.customer_id) {
      customerId = customerData.customer_id;
    } else {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: clientData.email,
        name: clientData.full_name,
        metadata: {
          client_id: actualClientId,
        },
      });

      customerId = customer.id;

      // Save the customer ID in the database
      const { error: insertError } = await supabase
        .from("stripe_customers")
        .insert([
          {
            client_id: actualClientId,
            customer_id: customerId,
          },
        ]);

      if (insertError) {
        throw new Error(`Error saving Stripe customer: ${insertError.message}`);
      }
    }

    // Check if the customer already has a subscription
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (existingSubscriptions.data.length > 0) {
      // Update the existing subscription
      const subscription = await stripe.subscriptions.update(
        existingSubscriptions.data[0].id,
        {
          items: [
            {
              id: existingSubscriptions.data[0].items.data[0].id,
              price: priceId,
            },
          ],
          payment_behavior: 'allow_incomplete',
        }
      );

      return new Response(
        JSON.stringify({ 
          subscription,
          message: "Subscription updated successfully" 
        }),
        {
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          },
        }
      );
    }

    // If a payment method ID is provided, create the subscription directly
    if (paymentMethodId) {
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        default_payment_method: paymentMethodId,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return new Response(
        JSON.stringify({ 
          subscription,
          message: "Subscription created successfully" 
        }),
        {
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          },
        }
      );
    } else {
      // Create a checkout session for the subscription
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/billing?success=true`,
        cancel_url: `${req.headers.get("origin")}/billing?canceled=true`,
        customer: customerId,
        client_reference_id: actualClientId,
        metadata: {
          client_id: actualClientId,
        },
      });

      return new Response(
        JSON.stringify({ 
          sessionId: session.id,
          url: session.url 
        }),
        {
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          },
        }
      );
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
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