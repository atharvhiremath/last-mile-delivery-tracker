import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  try {
    const { trackingNumber } = params;

    const order = await prisma.order.findUnique({
      where: { trackingNumber: trackingNumber.trim().toUpperCase() },
      include: {
        pickupZone: { select: { id: true, name: true, code: true } },
        dropZone: { select: { id: true, name: true, code: true } },
        assignedAgent: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        statusHistory: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: `No shipment found for tracking number "${trackingNumber}".` },
        { status: 404 }
      );
    }

    // Mask sensitive details for public view if needed, but return tracking timeline and status
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        trackingNumber: order.trackingNumber,
        status: order.status,
        senderName: order.senderName,
        senderCity: order.pickupCity,
        pickupAddress: order.pickupAddress,
        pickupPincode: order.pickupPincode,
        pickupLat: order.pickupLat,
        pickupLng: order.pickupLng,
        pickupZone: order.pickupZone,

        recipientName: order.recipientName,
        recipientCity: order.dropCity,
        dropAddress: order.dropAddress,
        dropPincode: order.dropPincode,
        dropLat: order.dropLat,
        dropLng: order.dropLng,
        dropZone: order.dropZone,

        orderType: order.orderType,
        paymentType: order.paymentType,
        totalAmount: order.totalAmount,
        itemDescription: order.itemDescription,
        billableWeightKg: order.billableWeightKg,
        volumetricWeightKg: order.volumetricWeightKg,
        actualWeightKg: order.actualWeightKg,

        assignedAgent: order.assignedAgent
          ? {
              name: order.assignedAgent.user.name,
              phone: order.assignedAgent.user.phone,
              vehicleType: order.assignedAgent.vehicleType,
              vehicleNumber: order.assignedAgent.vehicleNumber,
              rating: order.assignedAgent.rating,
              currentLatitude: order.assignedAgent.currentLatitude,
              currentLongitude: order.assignedAgent.currentLongitude,
            }
          : null,

        failedReason: order.failedReason,
        rescheduledDate: order.rescheduledDate,
        rescheduledSlot: order.rescheduledSlot,
        createdAt: order.createdAt,
        pickedUpAt: order.pickedUpAt,
        deliveredAt: order.deliveredAt,

        statusHistory: order.statusHistory,
      },
    });
  } catch (error: any) {
    console.error("Public track order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking details." },
      { status: 500 }
    );
  }
}
