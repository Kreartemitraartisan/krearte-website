import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// =========================
// ✅ GET PROFILE
// =========================
export async function GET() {
  try {
    const [{ prisma }, { getServerSession }, { authOptions }] =
      await Promise.all([
        import("@/lib/prisma"),
        import("next-auth"),
        import("@/app/api/auth/[...nextauth]/route"),
      ]);

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
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
    });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ UPDATE PROFILE / PASSWORD
// =========================
export async function PUT(request: Request) {
  try {
    const [
      { prisma },
      { getServerSession },
      { authOptions },
      bcrypt
    ] = await Promise.all([
      import("@/lib/prisma"),
      import("next-auth"),
      import("@/app/api/auth/[...nextauth]/route"),
      import("bcryptjs"),
    ]);

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

    // 🔐 PASSWORD UPDATE
    if (type === "password") {
      if (!user.password) {
        return NextResponse.json(
          { success: false, error: "Password not set" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(
        data.currentPassword,
        user.password
      );

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Wrong password" },
          { status: 400 }
        );
      }

      if (!data.newPassword || data.newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password min 6 char" },
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
        message: "Password updated",
      });
    }

    // 👤 PROFILE UPDATE
    if (type === "profile") {
      if (data.email && data.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          return NextResponse.json(
            { success: false, error: "Email already used" },
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
        message: "Profile updated",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type" },
      { status: 400 }
    );

  } catch (error) {
    console.error("PUT PROFILE ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}