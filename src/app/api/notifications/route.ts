import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    const where: Record<string, any> = {};
    if (orderId) where.orderId = orderId;

    if (session.role === "CUSTOMER") {
      where.order = { customerId: session.userId };
    }

    const notifications = await prisma.notificationLog.findMany({
      where,
      include: {
        order: {
          select: {
            trackingNumber: true,
            status: true,
            recipientName: true,
          },
        },
      },
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}
