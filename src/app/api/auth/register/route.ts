import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, role = "CUSTOMER", companyName, vehicleType, vehicleNumber, operatingZoneId } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: "Name, email, password, and phone are required." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const userRole = role === "ADMIN" ? "ADMIN" : role === "AGENT" ? "AGENT" : "CUSTOMER";

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone.trim(),
        role: userRole,
        companyName: companyName?.trim() || null,
        ...(userRole === "AGENT" && {
          agentProfile: {
            create: {
              vehicleType: vehicleType || "BIKE",
              vehicleNumber: vehicleNumber || "DL-01-AB-1234",
              operatingZoneId: operatingZoneId || null,
              currentLatitude: 28.6139,
              currentLongitude: 77.2090,
              isAvailable: true,
              maxCapacity: 5,
              currentActiveLoad: 0,
            },
          },
        }),
      },
      include: {
        agentProfile: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "CUSTOMER" | "AGENT" | "ADMIN",
      agentId: user.agentProfile?.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyName: user.companyName,
        agentId: user.agentProfile?.id,
      },
      token,
    });

    response.cookies.set("auth-token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
