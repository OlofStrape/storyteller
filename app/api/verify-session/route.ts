import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/utils/stripe";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID krävs" }, { status: 400 });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: "Session hittades inte" }, { status: 404 });
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: "Betalning inte genomförd" }, { status: 400 });
    }

    const { tier, period } = session.metadata || {};
    
    if (!tier || !period) {
      return NextResponse.json({ error: "Metadata saknas" }, { status: 400 });
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send confirmation email
    // 3. Log the successful payment
    
    console.log(`Payment verified: ${tier} ${period} for customer ${session.customer}`);

    return NextResponse.json({ 
      success: true,
      tier,
      period,
      customerId: session.customer
    });
    
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json({ 
      error: "Kunde inte verifiera session" 
    }, { status: 500 });
  }
}
