import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Simple developer premium activation
    const response = NextResponse.json({ 
      success: true, 
      message: "Developer premium activated!",
      tier: "premium"
    });
    
    // Set premium cookies for 365 days
    response.cookies.set('premium', '1', {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    response.cookies.set('premium_tier', 'premium', {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    response.cookies.set('billing_period', 'yearly', {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
    
  } catch (error: any) {
    console.error("Developer premium error:", error);
    return NextResponse.json({ error: "Failed to activate developer premium" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Remove premium cookies
    const response = NextResponse.json({ 
      success: true, 
      message: "Developer premium deactivated!"
    });
    
    response.cookies.set('premium', '', { maxAge: 0 });
    response.cookies.set('premium_tier', '', { maxAge: 0 });
    response.cookies.set('billing_period', '', { maxAge: 0 });
    
    return response;
    
  } catch (error: any) {
    console.error("Developer premium deactivation error:", error);
    return NextResponse.json({ error: "Failed to deactivate developer premium" }, { status: 500 });
  }
}
