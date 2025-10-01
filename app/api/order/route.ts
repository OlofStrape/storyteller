import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { storyId, title, format = "softcover", pages = 24, images = [], price = 149, hasPremium = false } = await req.json();
    if (!storyId) return NextResponse.json({ error: "storyId saknas" }, { status: 400 });
    if (!Array.isArray(images)) return NextResponse.json({ error: "images måste vara en array" }, { status: 400 });
    
    // Placeholder: enqueue job and return an order id
    const orderId = `ord_${Date.now()}`;
    const discount = hasPremium ? Math.round((price * 0.2)) : 0; // 20% rabatt för Premium
    const finalPrice = price - discount;
    
    console.log("Order request", { 
      orderId, 
      storyId, 
      title, 
      format, 
      pages, 
      imagesCount: images.length, 
      originalPrice: price,
      discount,
      finalPrice,
      hasPremium,
      at: new Date().toISOString() 
    });
    
    return NextResponse.json({ 
      ok: true, 
      orderId, 
      price: finalPrice,
      discount,
      hasPremium 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Okänt fel" }, { status: 500 });
  }
}


