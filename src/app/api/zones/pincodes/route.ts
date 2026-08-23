import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get("zoneId");

    const pincodes = await prisma.areaPincode.findMany({
      where: zoneId ? { zoneId } : undefined,
      include: {
        zone: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { pincode: "asc" },
    });

    return NextResponse.json({ success: true, pincodes });
  } catch (error: any) {
    console.error("Fetch pincodes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pincode mappings." },
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
    const { pincode, areaName, city, state, zoneId, latitude, longitude } = body;

    if (!pincode || !areaName || !city || !state || !zoneId) {
      return NextResponse.json(
        { error: "Pincode, Area Name, City, State, and Zone are required." },
        { status: 400 }
      );
    }

    const area = await prisma.areaPincode.upsert({
      where: { pincode: pincode.trim() },
      update: {
        areaName: areaName.trim(),
        city: city.trim(),
        state: state.trim(),
        zoneId,
        latitude: Number(latitude) || 28.6139,
        longitude: Number(longitude) || 77.2090,
      },
      create: {
        pincode: pincode.trim(),
        areaName: areaName.trim(),
        city: city.trim(),
        state: state.trim(),
        zoneId,
        latitude: Number(latitude) || 28.6139,
        longitude: Number(longitude) || 77.2090,
      },
      include: {
        zone: true,
      },
    });

    return NextResponse.json({ success: true, areaPincode: area });
  } catch (error: any) {
    console.error("Save pincode error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save area pincode mapping." },
      { status: 500 }
    );
  }
}
