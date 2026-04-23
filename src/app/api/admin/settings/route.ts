import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma = new PrismaClient();

// GET - Fetch settings
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();

    return NextResponse.json({
      success: true,
      settings: settings || {},
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { type, ...settingsData } = body;

    // Upsert settings (create if not exists, update if exists)
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
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}