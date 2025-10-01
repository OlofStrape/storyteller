import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Placeholder: set cookies for premium entitlement and tier for 30 days
  try {
    const { tier = "basic", period = "monthly" } = await req.json().catch(() => ({ tier: "basic", period: "monthly" }));
    const normalized = ["basic", "plus", "premium"].includes(String(tier)) ? String(tier) : "basic";
    const normalizedPeriod = ["monthly", "yearly"].includes(String(period)) ? String(period) : "monthly";
    
    // Set maxAge based on billing period (30 days for monthly, 365 days for yearly)
    const maxAge = normalizedPeriod === "yearly" ? 60 * 60 * 24 * 365 : 60 * 60 * 24 * 30;
    
    const res = NextResponse.json({ ok: true, premium: true, tier: normalized, period: normalizedPeriod });
    res.cookies.set("premium", "1", { httpOnly: false, sameSite: "lax", maxAge, path: "/" });
    res.cookies.set("premium_tier", normalized, { httpOnly: false, sameSite: "lax", maxAge, path: "/" });
    res.cookies.set("billing_period", normalizedPeriod, { httpOnly: false, sameSite: "lax", maxAge, path: "/" });
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ error: e?.message || "Okänt fel" }, { status: 500 });
    return res;
  }
}
