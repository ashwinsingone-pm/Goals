import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const membership = await db.membership.findFirst({
      where: { userId: session.user.id, status: "active" },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) return NextResponse.json({ success: false, error: "No active membership" }, { status: 403 });

    const teams = await db.team.findMany({
      where: { tenantId: membership.tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: teams });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch teams";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
