import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { weeklyValueSchema } from "@/lib/schemas/kpiSchema";
import { ApiResponse } from "@/lib/services/kpiService";

// Calculate health status based on progress
function calculateHealthStatus(progressPercent: number, status: string): string {
  if (status === "completed") return "complete";
  if (progressPercent >= 100) return "on-track";
  if (progressPercent >= 80) return "behind-schedule";
  return "critical";
}

// GET /api/kpi/[id]/weekly - Get all weekly values for a KPI
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Missing tenant context" },
        { status: 400 }
      );
    }

    // Check KPI exists and belongs to tenant
    const kpi = await db.kPI.findUnique({
      where: { id: params.id },
      select: { tenantId: true },
    });

    if (!kpi) {
      return NextResponse.json(
        { success: false, error: "KPI not found" },
        { status: 404 }
      );
    }

    if (kpi.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get weekly values
    const weeklyValues = await db.kPIWeeklyValue.findMany({
      where: { kpiId: params.id },
      select: {
        id: true,
        weekNumber: true,
        value: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { weekNumber: "asc" },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: weeklyValues,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`GET /api/kpi/[id]/weekly error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch weekly values",
      },
      { status: 500 }
    );
  }
}

// POST /api/kpi/[id]/weekly - Create or update weekly value (upsert)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Missing tenant context" },
        { status: 400 }
      );
    }

    // Get KPI
    const kpi = await db.kPI.findUnique({
      where: { id: params.id },
      select: {
        tenantId: true,
        qtdGoal: true,
        status: true,
        healthStatus: true,
      },
    });

    if (!kpi) {
      return NextResponse.json(
        { success: false, error: "KPI not found" },
        { status: 404 }
      );
    }

    if (kpi.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validated = weeklyValueSchema.parse(body);

    // Upsert weekly value
    const weeklyValue = await db.kPIWeeklyValue.upsert({
      where: {
        kpiId_weekNumber: {
          kpiId: params.id,
          weekNumber: validated.weekNumber,
        },
      },
      update: {
        value: validated.value,
        notes: validated.notes,
        updatedBy: session.user.id,
      },
      create: {
        kpiId: params.id,
        tenantId,
        weekNumber: validated.weekNumber,
        value: validated.value,
        notes: validated.notes,
        createdBy: session.user.id,
      },
      select: {
        id: true,
        kpiId: true,
        weekNumber: true,
        value: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate total achieved (sum of all weekly values)
    const weeklyValues = await db.kPIWeeklyValue.findMany({
      where: { kpiId: params.id },
      select: { value: true },
    });

    const totalAchieved = weeklyValues.reduce((sum, wv) => sum + (wv.value || 0), 0);
    const progressPercent = kpi.qtdGoal ? (totalAchieved / kpi.qtdGoal) * 100 : 0;
    const newHealthStatus = calculateHealthStatus(progressPercent, kpi.status);

    // Update KPI progress
    await db.kPI.update({
      where: { id: params.id },
      data: {
        qtdAchieved: totalAchieved,
        progressPercent,
        healthStatus: newHealthStatus,
        currentWeekValue: validated.value,
      },
    });

    // Create audit log
    await db.kPILog.create({
      data: {
        tenantId,
        kpiId: params.id,
        action: "UPDATE_WEEKLY",
        newValue: JSON.stringify(weeklyValue),
        changedBy: session.user.id,
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: weeklyValue,
      message: "Weekly value saved successfully",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error(`POST /api/kpi/[id]/weekly error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save weekly value",
      },
      { status: 500 }
    );
  }
}
