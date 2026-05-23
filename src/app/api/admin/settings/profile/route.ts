import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    // Verify current password if changing password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update with new password
      await prisma.user.update({
        where: { id: admin.id },
         data: {
          name,
          email,
          password: hashedPassword,
        },
      });
    } else {
      // Update without password change
      await prisma.user.update({
        where: { id: admin.id },
         data: {
          name,
          email,
        },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}