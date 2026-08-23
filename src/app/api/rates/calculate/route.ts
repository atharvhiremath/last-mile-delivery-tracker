import { NextRequest, NextResponse } from "next/server";
import { calculateDeliveryRate } from "@/lib/services/rateEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pickupPincode,
      dropPincode,
      pickupCoords,
      dropCoords,
      lengthCm,
      widthCm,
      heightCm,
      actualWeightKg,
      orderType = "B2C",
      paymentType = "PREPAID",
      declaredValue = 0,
    } = body;

    if (!pickupPincode || !dropPincode) {
      return NextResponse.json(
        { error: "Pickup and drop pincodes are required." },
        { status: 400 }
      );
    }

    if (
      Number(lengthCm) <= 0 ||
      Number(widthCm) <= 0 ||
      Number(heightCm) <= 0 ||
      Number(actualWeightKg) <= 0
    ) {
      return NextResponse.json(
        { error: "Dimensions (L, W, H) and actual weight must be greater than 0." },
        { status: 400 }
      );
    }

    const breakdown = await calculateDeliveryRate({
      pickupPincode: pickupPincode.toString().trim(),
      dropPincode: dropPincode.toString().trim(),
      pickupCoords,
      dropCoords,
      lengthCm: Number(lengthCm),
      widthCm: Number(widthCm),
      heightCm: Number(heightCm),
      actualWeightKg: Number(actualWeightKg),
      orderType: orderType === "B2B" ? "B2B" : "B2C",
      paymentType: paymentType === "COD" ? "COD" : "PREPAID",
      declaredValue: Number(declaredValue) || 0,
    });

    return NextResponse.json({
      success: true,
      breakdown,
    });
  } catch (error: any) {
    console.error("Rate calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate delivery rate." },
      { status: 400 }
    );
  }
}
