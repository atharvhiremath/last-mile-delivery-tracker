import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rateCards = await prisma.rateCard.findMany({
      orderBy: [{ orderType: "asc" }, { zoneScope: "asc" }],
    });

    return NextResponse.json({ success: true, rateCards });
  } catch (error: any) {
    console.error("Fetch rate cards error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rate cards." },
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
    const {
      name,
      orderType,
      zoneScope,
      baseWeightKg,
      baseRate,
      perKgRate,
      codSurchargeFixed,
      codSurchargePercent,
      minCodSurcharge,
      isActive = true,
    } = body;

    if (!name || !orderType || !zoneScope || baseRate === undefined || perKgRate === undefined) {
      return NextResponse.json(
        { error: "Name, Order Type, Zone Scope, Base Rate, and Per Kg Rate are required." },
        { status: 400 }
      );
    }

    const rateCard = await prisma.rateCard.create({
      data: {
        name: name.trim(),
        orderType: orderType === "B2B" ? "B2B" : "B2C",
        zoneScope: zoneScope === "INTER_ZONE" ? "INTER_ZONE" : "INTRA_ZONE",
        baseWeightKg: Number(baseWeightKg) || 0.5,
        baseRate: Number(baseRate),
        perKgRate: Number(perKgRate),
        codSurchargeFixed: Number(codSurchargeFixed) || 0,
        codSurchargePercent: Number(codSurchargePercent) || 0,
        minCodSurcharge: Number(minCodSurcharge) || 0,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, rateCard });
  } catch (error: any) {
    console.error("Create rate card error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create rate card." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      name,
      baseWeightKg,
      baseRate,
      perKgRate,
      codSurchargeFixed,
      codSurchargePercent,
      minCodSurcharge,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Rate card ID is required." }, { status: 400 });
    }

    const updated = await prisma.rateCard.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(baseWeightKg !== undefined && { baseWeightKg: Number(baseWeightKg) }),
        ...(baseRate !== undefined && { baseRate: Number(baseRate) }),
        ...(perKgRate !== undefined && { perKgRate: Number(perKgRate) }),
        ...(codSurchargeFixed !== undefined && { codSurchargeFixed: Number(codSurchargeFixed) }),
        ...(codSurchargePercent !== undefined && { codSurchargePercent: Number(codSurchargePercent) }),
        ...(minCodSurcharge !== undefined && { minCodSurcharge: Number(minCodSurcharge) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, rateCard: updated });
  } catch (error: any) {
    console.error("Update rate card error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update rate card." },
      { status: 500 }
    );
  }
}
