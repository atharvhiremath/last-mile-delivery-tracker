import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        pincodes: true,
        agents: {
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
        _count: {
          select: { pickupOrders: true, dropOrders: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, zones });
  } catch (error: any) {
    console.error("Fetch zones error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery zones." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, description, centerLat, centerLng } = body;

    if (!name || !code || centerLat === undefined || centerLng === undefined) {
      return NextResponse.json(
        { error: "Name, Code, centerLat, and centerLng are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.zone.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A zone with this code already exists." },
        { status: 409 }
      );
    }

    const zone = await prisma.zone.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        centerLat: Number(centerLat),
        centerLng: Number(centerLng),
      },
    });

    return NextResponse.json({ success: true, zone });
  } catch (error: any) {
    console.error("Create zone error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create zone." },
      { status: 500 }
    );
  }
}
