import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/utils/stripe";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    const stripe = getStripeInstance();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const tier = session.metadata?.tier || "basic";
        const period = session.metadata?.period || "monthly";
        
        // Here you would typically:
        // 1. Save subscription to database
        // 2. Send confirmation email
        // 3. Update user's premium status
        
        console.log(`Subscription created: ${tier} ${period} for customer ${session.customer}`);
        break;
        
      case "customer.subscription.updated":
        const subscription = event.data.object;
        console.log(`Subscription updated: ${subscription.id}`);
        break;
        
      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        console.log(`Subscription cancelled: ${deletedSubscription.id}`);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
