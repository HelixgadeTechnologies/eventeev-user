import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const host = req.headers.get("origin") || "http://localhost:3000";
    const amount = 5000 * 100; // 5000 NGN in Kobo

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        callback_url: `${host}/dashboard`,
        metadata: {
          custom_fields: [
            {
              display_name: "Registration Fee",
              variable_name: "registration_fee",
              value: "Event Registration",
            },
          ],
        },
      }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Paystack JSON:", text);
    }

    if (!response.ok) {
      console.error("Paystack API Error:", response.status, text);
      return NextResponse.json(
        { error: "Payment initialization failed", details: data, status: response.status },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error initializing Paystack transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
