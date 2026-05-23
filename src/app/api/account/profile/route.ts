import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ✅ GET - Fetch user profile data
export async function GET() {
  try {
    console.log('🔐 GET /api/account/profile - Starting...');
    
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', session);

    if (!session?.user?.email) {
      console.log('❌ No session or email');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('📧 Fetching user:', session.user.email);

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

    console.log('✅ User found:', user);

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
    console.error('❌ GET /api/account/profile - Error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ PUT - Update profile or password
export async function PUT(request: Request) {
  try {
    console.log('🔐 PUT /api/account/profile - Starting...');
    
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', session);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📦 Request body:', body);
    
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

    if (type === "password") {
      const isValid = await bcrypt.compare(data.currentPassword, user.password);
      
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
        message: "Password changed successfully"
      });
    }

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
        message: "Profile updated successfully"
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type. Use 'profile' or 'password'" },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ PUT /api/account/profile - Error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}