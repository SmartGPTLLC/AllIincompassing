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
    const { amount, clientId, description, metadata = {} } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
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

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      description,
      metadata: {
        client_id: actualClientId,
        ...metadata,
      },
      receipt_email: clientData.email,
    });

    // Create a billing record in the database
    const { error: billingError } = await supabase
      .from("billing_records")
      .insert([
        {
          session_id: metadata.session_id || null,
          amount: amount / 100, // Convert cents to dollars
          status: "pending",
          claim_number: metadata.claim_number || null,
        },
      ]);

    if (billingError) {
      console.error("Error creating billing record:", billingError);
    }

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret 
      }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
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