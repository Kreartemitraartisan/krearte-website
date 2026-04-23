import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// ✅ Gunakan prisma singleton (JANGAN new PrismaClient() di level modul!)
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ✅ WAJIB: Cegah Next.js nge-build route ini secara statis
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ✅ GET - Fetch user profile data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("❌ GET profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update profile or password
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, ...data } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // =========================
    // 🔐 PASSWORD UPDATE
    // =========================
    if (type === "password") {
      // ✅ handle user tanpa password (OAuth case)
      if (!user.password) {
        return NextResponse.json(
          { success: false, error: "Password not set for this account" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(
        data.currentPassword,
        user.password
      );

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      if (!data.newPassword || data.newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    // =========================
    // 👤 PROFILE UPDATE
    // =========================
    if (type === "profile") {
      if (data.email && data.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          return NextResponse.json(
            { success: false, error: "Email already in use" },
            { status: 400 }
          );
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type. Use 'profile' or 'password'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ PUT profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}