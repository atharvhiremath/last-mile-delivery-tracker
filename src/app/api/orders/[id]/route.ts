import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true, companyName: true },
        },
        pickupZone: true,
        dropZone: true,
        assignedAgent: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
          },
        },
        statusHistory: {
          orderBy: { timestamp: "desc" },
        },
        notifications: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Role-based visibility check
    if (session.role === "CUSTOMER" && order.customerId !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (session.role === "AGENT" && order.assignedAgentId !== session.agentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Fetch single order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details." },
      { status: 500 }
    );
  }
}
