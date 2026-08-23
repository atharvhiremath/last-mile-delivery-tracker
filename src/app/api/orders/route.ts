import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { calculateDeliveryRate } from "@/lib/services/rateEngine";
import { logOrderStatusChange } from "@/lib/services/trackingService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const zoneId = searchParams.get("zoneId");
    const agentId = searchParams.get("agentId");
    const orderType = searchParams.get("orderType");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};

    // Role-based restrictions
    if (session.role === "CUSTOMER") {
      where.customerId = session.userId;
    } else if (session.role === "AGENT") {
      if (!session.agentId) {
        return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
      }
      where.assignedAgentId = session.agentId;
    } else if (session.role === "ADMIN") {
      // Admin filter options
      if (status) where.status = status;
      if (zoneId) {
        where.OR = [{ pickupZoneId: zoneId }, { dropZoneId: zoneId }];
      }
      if (agentId) where.assignedAgentId = agentId;
      if (orderType) where.orderType = orderType;
    }

    if (search) {
      where.OR = [
        { trackingNumber: { contains: search } },
        { senderName: { contains: search } },
        { recipientName: { contains: search } },
        { pickupCity: { contains: search } },
        { dropCity: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        pickupZone: true,
        dropZone: true,
        assignedAgent: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        statusHistory: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("Fetch orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId: targetCustomerId,
      senderName,
      senderPhone,
      pickupAddress,
      pickupPincode,
      pickupArea,
      pickupCity,
      pickupCoords,
      recipientName,
      recipientPhone,
      dropAddress,
      dropPincode,
      dropArea,
      dropCity,
      dropCoords,
      lengthCm,
      widthCm,
      heightCm,
      actualWeightKg,
      orderType = "B2C",
      paymentType = "PREPAID",
      itemDescription,
      declaredValue = 0,
      deliveryNotes,
    } = body;

    // Determine target customer (Customers create for themselves, Admin can create on behalf of any customer)
    let customerId = session.userId;
    if (session.role === "ADMIN" && targetCustomerId) {
      customerId = targetCustomerId;
    }

    if (
      !senderName ||
      !senderPhone ||
      !pickupAddress ||
      !pickupPincode ||
      !recipientName ||
      !recipientPhone ||
      !dropAddress ||
      !dropPincode ||
      !itemDescription
    ) {
      return NextResponse.json(
        { error: "All required sender, recipient, address, and item fields must be filled." },
        { status: 400 }
      );
    }

    // 1. Calculate dynamic rate & detect zones
    const rateBreakdown = await calculateDeliveryRate({
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

    // 2. Generate unique tracking number (e.g., LMD-2026-XXXXX)
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const trackingNumber = `LMD-2026-${randomDigits}`;

    // 3. Create Order in Database
    const newOrder = await prisma.order.create({
      data: {
        trackingNumber,
        customerId,
        createdById: session.userId,

        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        pickupAddress: pickupAddress.trim(),
        pickupPincode: pickupPincode.toString().trim(),
        pickupArea: pickupArea || rateBreakdown.pickupZoneName,
        pickupCity: pickupCity || "Metropolis",
        pickupZoneId: rateBreakdown.pickupZoneId,
        pickupLat: rateBreakdown.pickupCoordinates?.latitude || 28.6139,
        pickupLng: rateBreakdown.pickupCoordinates?.longitude || 77.2090,

        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        dropAddress: dropAddress.trim(),
        dropPincode: dropPincode.toString().trim(),
        dropArea: dropArea || rateBreakdown.dropZoneName,
        dropCity: dropCity || "Metropolis",
        dropZoneId: rateBreakdown.dropZoneId,
        dropLat: rateBreakdown.dropCoordinates?.latitude || 28.7041,
        dropLng: rateBreakdown.dropCoordinates?.longitude || 77.1025,

        lengthCm: rateBreakdown.lengthCm,
        widthCm: rateBreakdown.widthCm,
        heightCm: rateBreakdown.heightCm,
        actualWeightKg: rateBreakdown.actualWeightKg,
        volumetricWeightKg: rateBreakdown.volumetricWeightKg,
        billableWeightKg: rateBreakdown.billableWeightKg,

        orderType: rateBreakdown.orderType,
        paymentType: rateBreakdown.paymentType,
        itemDescription: itemDescription.trim(),
        declaredValue: Number(declaredValue) || 0,

        baseCharge: rateBreakdown.baseCharge,
        weightCharge: rateBreakdown.weightCharge,
        codCharge: rateBreakdown.codCharge,
        taxAmount: rateBreakdown.taxAmount,
        totalAmount: rateBreakdown.totalAmount,
        rateCardId: rateBreakdown.rateCardId,

        status: "PLACED",
        deliveryNotes: deliveryNotes?.trim() || null,
      },
      include: {
        customer: true,
        pickupZone: true,
        dropZone: true,
      },
    });

    // 4. Record Initial Immutable Status History & Notify
    await logOrderStatusChange({
      orderId: newOrder.id,
      status: "PLACED",
      actorId: session.userId,
      actorRole: session.role,
      actorName: session.name,
      notes: `Order created. Billable Weight: ${rateBreakdown.billableWeightKg} kg (${rateBreakdown.weightBasis}). Rate Card: ${rateBreakdown.rateCardName}. Total: $${rateBreakdown.totalAmount}.`,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      rateBreakdown,
    });
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order." },
      { status: 500 }
    );
  }
}
