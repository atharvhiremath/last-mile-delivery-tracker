import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logOrderStatusChange } from "@/lib/services/trackingService";

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
    const { rescheduledDate, rescheduledSlot, deliveryNotes } = body;

    if (!rescheduledDate || !rescheduledSlot) {
      return NextResponse.json(
        { error: "Reschedule date and preferred delivery time slot are required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Role check: customer who owns the order or admin
    if (session.role === "CUSTOMER" && order.customerId !== session.userId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    if (order.status !== "FAILED") {
      return NextResponse.json(
        { error: `Only failed orders can be rescheduled. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    const parsedDate = new Date(rescheduledDate);

    const result = await logOrderStatusChange({
      orderId,
      status: "RESCHEDULED",
      previousStatus: "FAILED",
      actorId: session.userId,
      actorRole: session.role,
      actorName: session.name,
      notes: `Rescheduled by customer for ${parsedDate.toLocaleDateString()} (${rescheduledSlot}). Special notes: ${deliveryNotes || "None"}`,
      rescheduledDate: parsedDate,
      rescheduledSlot,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Reschedule order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reschedule order." },
      { status: 500 }
    );
  }
}
