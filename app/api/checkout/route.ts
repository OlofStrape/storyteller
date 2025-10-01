import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/utils/stripe";

export async function POST(req: NextRequest) {
  try {
    const { tier, period } = await req.json();
    
    if (!tier || !period) {
      return NextResponse.json({ error: "Tier och period krävs" }, { status: 400 });
    }
    
    if (!['basic', 'plus', 'premium'].includes(tier)) {
      return NextResponse.json({ error: "Ogiltig tier" }, { status: 400 });
    }
    
    if (!['monthly', 'yearly'].includes(period)) {
      return NextResponse.json({ error: "Ogiltig period" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const session = await createCheckoutSession(
      tier,
      period,
      `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      `${baseUrl}/cancel`
    );

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
    
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ 
      error: "Kunde inte skapa checkout-session" 
    }, { status: 500 });
  }
}
