import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// =========================
// ✅ GET - Fetch settings
// =========================
export async function GET() {
  try {
    // ✅ WAJIB lazy import (jangan new PrismaClient)
    const { prisma } = await import("@/lib/prisma");

    const settings = await prisma.settings.findFirst();

    return NextResponse.json({
      success: true,
      settings: settings || {},
    });

  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ PUT - Update settings
// =========================
export async function PUT(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");

    const body = await request.json();
    const { type, ...settingsData } = body;

    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: settingsData,
      create: {
        id: "default",
        ...settingsData,
      },
    });

    return NextResponse.json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error("PUT SETTINGS ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}