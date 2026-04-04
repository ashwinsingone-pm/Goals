import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { updateKPISchema } from "@/lib/schemas/kpiSchema";
import { ApiResponse } from "@/lib/services/kpiService";

// GET /api/kpi/[id] - Get single KPI
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

    const kpi = await db.kPI.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        tenantId: true,
        name: true,
        description: true,
        owner: true,
        teamId: true,
        parentKPIId: true,
        quarter: true,
        year: true,
        measurementUnit: true,
        target: true,
        quarterlyGoal: true,
        qtdGoal: true,
        qtdAchieved: true,
        currentWeekValue: true,
        progressPercent: true,
        status: true,
        healthStatus: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!kpi) {
      return NextResponse.json(
        { success: false, error: "KPI not found" },
        { status: 404 }
      );
    }

    // Check tenant access
    if (kpi.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: kpi,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`GET /api/kpi/[id] error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch KPI",
      },
      { status: 500 }
    );
  }
}

// PUT /api/kpi/[id] - Update KPI
export async function PUT(
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

    // Get existing KPI
    const existingKPI = await db.kPI.findUnique({
      where: { id: params.id },
    });

    if (!existingKPI) {
      return NextResponse.json(
        { success: false, error: "KPI not found" },
        { status: 404 }
      );
    }

    // Check tenant access
    if (existingKPI.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validated = updateKPISchema.parse(body);

    // Store old value for audit
    const oldValue = JSON.stringify(existingKPI);

    // Update KPI
    const updatedKPI = await db.kPI.update({
      where: { id: params.id },
      data: {
        name: validated.name,
        description: validated.description,
        owner: validated.owner,
        teamId: validated.teamId,
        parentKPIId: validated.parentKPIId,
        quarter: validated.quarter,
        year: validated.year,
        measurementUnit: validated.measurementUnit,
        target: validated.target,
        quarterlyGoal: validated.quarterlyGoal,
        qtdGoal: validated.qtdGoal,
        status: validated.status,
        updatedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        owner: true,
        teamId: true,
        parentKPIId: true,
        quarter: true,
        year: true,
        measurementUnit: true,
        target: true,
        quarterlyGoal: true,
        qtdGoal: true,
        qtdAchieved: true,
        progressPercent: true,
        status: true,
        healthStatus: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    });

    // Create audit log
    await db.kPILog.create({
      data: {
        tenantId,
        kpiId: params.id,
        action: "UPDATE",
        oldValue,
        newValue: JSON.stringify(updatedKPI),
        changedBy: session.user.id,
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: updatedKPI,
      message: "KPI updated successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`PUT /api/kpi/[id] error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update KPI",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/kpi/[id] - Delete KPI
export async function DELETE(
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
    });

    if (!kpi) {
      return NextResponse.json(
        { success: false, error: "KPI not found" },
        { status: 404 }
      );
    }

    // Check tenant access
    if (kpi.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Store old value for audit
    const oldValue = JSON.stringify(kpi);

    // Delete KPI (cascade deletes weekly values, notes, logs)
    await db.kPI.delete({
      where: { id: params.id },
    });

    // Create audit log for deletion
    await db.kPILog.create({
      data: {
        tenantId,
        kpiId: params.id,
        action: "DELETE",
        oldValue,
        changedBy: session.user.id,
      },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: "KPI deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`DELETE /api/kpi/[id] error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete KPI",
      },
      { status: 500 }
    );
  }
}
