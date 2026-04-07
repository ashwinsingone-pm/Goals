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

// PUT /api/org/users/[id] — update user details and/or membership
// [id] = userId
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const tenantId = await getTenantId(session.user.id);
    if (!tenantId)
      return NextResponse.json({ success: false, error: "No active membership" }, { status: 403 });

    const membership = await db.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId: params.id } },
    });
    if (!membership)
      return NextResponse.json({ success: false, error: "User not found in this organisation" }, { status: 404 });

    const body = await request.json();
    const { firstName, lastName, email, password, role, teamId, status } = body;

    // Update user record
    const userUpdates: Record<string, unknown> = {};
    if (firstName?.trim()) userUpdates.firstName = firstName.trim();
    if (lastName?.trim())  userUpdates.lastName  = lastName.trim();
    if (email?.trim())     userUpdates.email     = email.trim().toLowerCase();
    if (password?.trim())  userUpdates.password  = await bcrypt.hash(password.trim(), 12);

    if (Object.keys(userUpdates).length > 0) {
      await db.user.update({ where: { id: params.id }, data: userUpdates });
    }

    // Update membership record
    const membershipUpdates: Record<string, unknown> = {};
    if (role   !== undefined) membershipUpdates.role   = role;
    if (status !== undefined) membershipUpdates.status = status;
    membershipUpdates.teamId = teamId !== undefined ? (teamId || null) : undefined;
    // Remove undefined values
    Object.keys(membershipUpdates).forEach(k => membershipUpdates[k] === undefined && delete membershipUpdates[k]);

    const updated = await db.membership.update({
      where: { tenantId_userId: { tenantId, userId: params.id } },
      data: membershipUpdates,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, lastSignInAt: true } },
        team: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        membershipId: updated.id,
        userId:       updated.user.id,
        firstName:    updated.user.firstName,
        lastName:     updated.user.lastName,
        email:        updated.user.email,
        avatar:       updated.user.avatar,
        lastSignInAt: updated.user.lastSignInAt?.toISOString() ?? null,
        role:         updated.role,
        teamId:       updated.teamId,
        teamName:     updated.team?.name ?? null,
        status:       updated.status,
        joinedAt:     updated.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/org/users/[id] — remove user from tenant (deactivate membership)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Prevent self-removal
    if (params.id === session.user.id)
      return NextResponse.json({ success: false, error: "You cannot remove yourself" }, { status: 400 });

    const tenantId = await getTenantId(session.user.id);
    if (!tenantId)
      return NextResponse.json({ success: false, error: "No active membership" }, { status: 403 });

    const membership = await db.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId: params.id } },
    });
    if (!membership)
      return NextResponse.json({ success: false, error: "User not found in this organisation" }, { status: 404 });

    // Soft delete — deactivate the membership
    await db.membership.update({
      where: { tenantId_userId: { tenantId, userId: params.id } },
      data: { status: "inactive" },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to remove user";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
