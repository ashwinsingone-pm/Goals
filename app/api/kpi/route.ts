import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { createKPISchema, kpiListParamsSchema } from "@/lib/schemas/kpiSchema";
import { ApiResponse } from "@/lib/services/kpiService";

// GET /api/kpi - List KPIs with filters and pagination
export async function GET(request: NextRequest) {
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const params = {
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      status: searchParams.get("status") || undefined,
      owner: searchParams.get("owner") || undefined,
      teamId: searchParams.get("teamId") || undefined,
      quarter: searchParams.get("quarter") || undefined,
      year: searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    // Validate params
    const validated = kpiListParamsSchema.parse(params);

    // Build filters
    const where: any = { tenantId };
    if (validated.status) where.status = validated.status;
    if (validated.owner) where.owner = validated.owner;
    if (validated.teamId) where.teamId = validated.teamId;
    if (validated.quarter) where.quarter = validated.quarter;
    if (validated.year) where.year = validated.year;
    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: "insensitive" } },
        { description: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    // Build order by
    const orderBy: any = {};
    orderBy[validated.sortBy] = validated.sortOrder;

    // Count total
    const total = await db.kPI.count({ where });

    // Fetch KPIs
    const kpis = await db.kPI.findMany({
      where,
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
      orderBy,
      skip: (validated.page - 1) * validated.pageSize,
      take: validated.pageSize,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        kpis,
        total,
        page: validated.page,
        pageSize: validated.pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("GET /api/kpi error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch KPIs",
      },
      { status: 500 }
    );
  }
}

// POST /api/kpi - Create KPI
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validated = createKPISchema.parse(body);

    // Check if owner exists
    const owner = await db.user.findUnique({
      where: { id: validated.owner },
    });
    if (!owner) {
      return NextResponse.json(
        { success: false, error: "Owner user not found" },
        { status: 404 }
      );
    }

    // Check if team exists (if provided)
    if (validated.teamId) {
      const team = await db.team.findUnique({
        where: { id: validated.teamId },
      });
      if (!team || team.tenantId !== tenantId) {
        return NextResponse.json(
          { success: false, error: "Team not found" },
          { status: 404 }
        );
      }
    }

    // Check if parent KPI exists (if provided)
    if (validated.parentKPIId) {
      const parentKPI = await db.kPI.findUnique({
        where: { id: validated.parentKPIId },
      });
      if (!parentKPI || parentKPI.tenantId !== tenantId) {
        return NextResponse.json(
          { success: false, error: "Parent KPI not found" },
          { status: 404 }
        );
      }
    }

    // Create KPI
    const kpi = await db.kPI.create({
      data: {
        tenantId,
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
        progressPercent: 0,
        status: validated.status || "active",
        healthStatus: "on-track",
        createdBy: session.user.id,
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
        kpiId: kpi.id,
        action: "CREATE",
        newValue: JSON.stringify(kpi),
        changedBy: session.user.id,
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: kpi,
      message: "KPI created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/kpi error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create KPI",
      },
      { status: 500 }
    );
  }
}
