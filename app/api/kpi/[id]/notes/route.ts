import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { kpiNoteSchema } from "@/lib/schemas/kpiSchema";
import { ApiResponse } from "@/lib/services/kpiService";

// GET /api/kpi/[id]/notes - Get all notes for a KPI
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

    // Get notes
    const notes = await db.kPINote.findMany({
      where: { kpiId: params.id },
      select: {
        id: true,
        content: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: notes,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`GET /api/kpi/[id]/notes error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch notes",
      },
      { status: 500 }
    );
  }
}

// POST /api/kpi/[id]/notes - Add note to KPI
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

    // Parse and validate body
    const body = await request.json();
    const validated = kpiNoteSchema.parse(body);

    // Create note
    const note = await db.kPINote.create({
      data: {
        kpiId: params.id,
        tenantId,
        content: validated.content,
        authorId: session.user.id,
      },
      select: {
        id: true,
        content: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await db.kPILog.create({
      data: {
        tenantId,
        kpiId: params.id,
        action: "ADD_NOTE",
        newValue: JSON.stringify(note),
        changedBy: session.user.id,
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: note,
      message: "Note added successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error(`POST /api/kpi/[id]/notes error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add note",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/kpi/[id]/notes/[noteId] - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId?: string } }
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

    // Extract noteId from URL path
    const pathParts = request.nextUrl.pathname.split("/");
    const noteId = pathParts[pathParts.length - 1];

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: "Note ID is required" },
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

    // Get note to verify it belongs to KPI
    const note = await db.kPINote.findUnique({
      where: { id: noteId },
    });

    if (!note || note.kpiId !== params.id) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      );
    }

    // Delete note
    await db.kPINote.delete({
      where: { id: noteId },
    });

    // Create audit log
    await db.kPILog.create({
      data: {
        tenantId,
        kpiId: params.id,
        action: "DELETE_NOTE",
        oldValue: JSON.stringify(note),
        changedBy: session.user.id,
      },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: "Note deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`DELETE /api/kpi/[id]/notes/[noteId] error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete note",
      },
      { status: 500 }
    );
  }
}
