import { NextResponse } from "next/server";
import { getUserTTSInfoFromCookies, determineTTSProvider } from "@/utils/ttsTiers";

export async function POST(req: Request) {
  try {
    const { storyId, paymentMethod = "stripe" } = await req.json();
    
    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    // Get user's current TTS info
    const cookieHeader = req.headers.get("cookie") || "";
    const userTTSInfo = getUserTTSInfoFromCookies(cookieHeader);
    
    // Check if user can upgrade
    const ttsDecision = determineTTSProvider(userTTSInfo);
    
    if (!ttsDecision.canUpgrade) {
      return NextResponse.json({ 
        error: "Du kan inte uppgradera denna saga till ElevenLabs",
        reason: ttsDecision.reason 
      }, { status: 400 });
    }

    // Here you would integrate with your payment system (Stripe, etc.)
    // For now, we'll simulate a successful payment
    
    // TODO: Implement actual payment processing
    // const paymentResult = await processPayment({
    //   amount: ttsDecision.upgradePrice * 100, // Convert to öre
    //   currency: 'sek',
    //   description: `Uppgradering till Magisk röst för saga ${storyId}`,
    //   paymentMethod
    // });

    // For demo purposes, we'll just return success
    const paymentResult = {
      success: true,
      transactionId: `txn_${Date.now()}`,
      amount: ttsDecision.upgradePrice
    };

    if (!paymentResult.success) {
      return NextResponse.json({ 
        error: "Betalningen misslyckades" 
      }, { status: 402 });
    }

    // Return success with upgrade information
    return NextResponse.json({
      success: true,
      message: "Saga uppgraderad till Magisk röst!",
      transactionId: paymentResult.transactionId,
      amount: paymentResult.amount,
      storyId: storyId,
      provider: "elevenlabs"
    });

  } catch (e: any) {
    console.error("TTS Upgrade Error:", e);
    return NextResponse.json({ 
      error: e?.message || "Uppgradering misslyckades" 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Get user's current TTS info and available upgrades
    const cookieHeader = req.headers.get("cookie") || "";
    const userTTSInfo = getUserTTSInfoFromCookies(cookieHeader);
    const ttsDecision = determineTTSProvider(userTTSInfo);
    
    return NextResponse.json({
      canUpgrade: ttsDecision.canUpgrade,
      upgradePrice: ttsDecision.upgradePrice,
      currentProvider: ttsDecision.provider,
      reason: ttsDecision.reason,
      userTier: userTTSInfo.tier,
      elevenLabsRemaining: userTTSInfo.maxElevenLabsFree - userTTSInfo.elevenLabsStoriesUsed,
      storiesGenerated: userTTSInfo.storiesGenerated
    });

  } catch (e: any) {
    console.error("TTS Upgrade Info Error:", e);
    return NextResponse.json({ 
      error: e?.message || "Kunde inte hämta uppgraderingsinformation" 
    }, { status: 500 });
  }
}
