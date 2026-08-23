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
    const availableOnly = searchParams.get("available") === "true";
    const zoneId = searchParams.get("zoneId");

    const where: Record<string, any> = {};
    if (availableOnly) {
      where.isAvailable = true;
    }
    if (zoneId) {
      where.operatingZoneId = zoneId;
    }

    const agents = await prisma.deliveryAgent.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        operatingZone: {
          select: { id: true, name: true, code: true },
        },
        assignedOrders: {
          where: {
            status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
          },
          select: { id: true, trackingNumber: true, status: true },
        },
      },
      orderBy: [{ isAvailable: "desc" }, { currentActiveLoad: "asc" }],
    });

    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    console.error("Fetch agents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery agents." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { agentId: targetAgentId, isAvailable, currentLatitude, currentLongitude, vehicleType, vehicleNumber, operatingZoneId } = body;

    let agentId = session.agentId;
    if (session.role === "ADMIN" && targetAgentId) {
      agentId = targetAgentId;
    }

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID not provided or user is not an agent." }, { status: 400 });
    }

    const updated = await prisma.deliveryAgent.update({
      where: { id: agentId },
      data: {
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(currentLatitude !== undefined && { currentLatitude: Number(currentLatitude) }),
        ...(currentLongitude !== undefined && { currentLongitude: Number(currentLongitude) }),
        ...(vehicleType && { vehicleType }),
        ...(vehicleNumber && { vehicleNumber }),
        ...(operatingZoneId !== undefined && { operatingZoneId: operatingZoneId || null }),
      },
      include: {
        user: true,
        operatingZone: true,
      },
    });

    return NextResponse.json({ success: true, agent: updated });
  } catch (error: any) {
    console.error("Update agent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update agent profile." },
      { status: 500 }
    );
  }
}
