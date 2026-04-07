import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function getTenantId(userId: string): Promise<string | null> {
  const m = await db.membership.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "asc" },
  });
  return m?.tenantId ?? null;
}

// GET /api/org/users — all members in tenant with full details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const tenantId = await getTenantId(session.user.id);
    if (!tenantId)
      return NextResponse.json({ success: false, error: "No active membership" }, { status: 403 });

    const memberships = await db.membership.findMany({
      where: { tenantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, lastSignInAt: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const data = memberships.map(m => ({
      membershipId: m.id,
      userId:       m.user.id,
      firstName:    m.user.firstName,
      lastName:     m.user.lastName,
      email:        m.user.email,
      avatar:       m.user.avatar,
      lastSignInAt: m.user.lastSignInAt?.toISOString() ?? null,
      role:         m.role,
      teamId:       m.teamId,
      teamName:     m.team?.name ?? null,
      status:       m.status,
      joinedAt:     m.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/org/users — create new user and add to tenant
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const tenantId = await getTenantId(session.user.id);
    if (!tenantId)
      return NextResponse.json({ success: false, error: "No active membership" }, { status: 403 });

    const body = await request.json();
    const { firstName, lastName, email, password, role = "member", teamId } = body;

    if (!firstName?.trim()) return NextResponse.json({ success: false, error: "First name is required" }, { status: 400 });
    if (!lastName?.trim())  return NextResponse.json({ success: false, error: "Last name is required" }, { status: 400 });
    if (!email?.trim())     return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    if (!password?.trim())  return NextResponse.json({ success: false, error: "Password is required" }, { status: 400 });

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    if (existingUser) {
      // Check if already member of this tenant
      const existingMembership = await db.membership.findUnique({
        where: { tenantId_userId: { tenantId, userId: existingUser.id } },
      });
      if (existingMembership) {
        return NextResponse.json({ success: false, error: "This user is already a member of the organisation" }, { status: 409 });
      }
      // Add existing user to this tenant
      const membership = await db.membership.create({
        data: {
          tenantId,
          userId:    existingUser.id,
          role,
          teamId:    teamId || null,
          status:    "active",
          createdBy: session.user.id,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, lastSignInAt: true } },
          team: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          membershipId: membership.id,
          userId:       membership.user.id,
          firstName:    membership.user.firstName,
          lastName:     membership.user.lastName,
          email:        membership.user.email,
          avatar:       membership.user.avatar,
          lastSignInAt: membership.user.lastSignInAt?.toISOString() ?? null,
          role:         membership.role,
          teamId:       membership.teamId,
          teamName:     membership.team?.name ?? null,
          status:       membership.status,
          joinedAt:     membership.createdAt.toISOString(),
        },
      }, { status: 201 });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password.trim(), 12);
    const user = await db.user.create({
      data: {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim().toLowerCase(),
        password:  hashedPassword,
      },
    });

    const membership = await db.membership.create({
      data: {
        tenantId,
        userId:    user.id,
        role,
        teamId:    teamId || null,
        status:    "active",
        createdBy: session.user.id,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, lastSignInAt: true } },
        team: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        membershipId: membership.id,
        userId:       membership.user.id,
        firstName:    membership.user.firstName,
        lastName:     membership.user.lastName,
        email:        membership.user.email,
        avatar:       membership.user.avatar,
        lastSignInAt: membership.user.lastSignInAt?.toISOString() ?? null,
        role:         membership.role,
        teamId:       membership.teamId,
        teamName:     membership.team?.name ?? null,
        status:       membership.status,
        joinedAt:     membership.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
