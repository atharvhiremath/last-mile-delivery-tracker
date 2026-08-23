import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logOrderStatusChange, OrderStatus } from "@/lib/services/trackingService";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = params;
    const body = await req.json();
    const {
      status,
      notes,
      latitude,
      longitude,
      failedReason,
      proofOfDelivery,
      isAdminOverride = false,
    } = body;

    if (!status) {
      return NextResponse.json({ error: "Target status is required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { assignedAgent: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Role verification
    if (session.role === "AGENT") {
      if (order.assignedAgentId !== session.agentId) {
        return NextResponse.json(
          { error: "You can only update status for orders assigned to you." },
          { status: 403 }
        );
      }
      if (status === "FAILED" && !failedReason && !notes) {
        return NextResponse.json(
          { error: "A failure reason is mandatory when marking a delivery as Failed." },
          { status: 400 }
        );
      }
    } else if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only delivery agents or admins can update order delivery status." },
        { status: 403 }
      );
    }

    const isOverride = session.role === "ADMIN" && Boolean(isAdminOverride);

    const result = await logOrderStatusChange({
      orderId,
      status: status as OrderStatus,
      previousStatus: order.status as OrderStatus,
      actorId: session.userId,
      actorRole: session.role,
      actorName: session.name,
      notes,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      failedReason: failedReason || notes,
      proofOfDelivery,
      isAdminOverride: isOverride,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order status." },
      { status: 400 }
    );
  }
}
