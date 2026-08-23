import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { autoAssignOrder, manualAssignAgent } from "@/lib/services/assignmentEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required for agent assignment." }, { status: 403 });
    }

    const { id: orderId } = params;
    const body = await req.json();
    const { auto, agentId } = body;

    let result;
    if (auto || !agentId) {
      // Trigger intelligent auto-assignment
      result = await autoAssignOrder(orderId, {
        id: session.userId,
        name: session.name,
        role: session.role,
      });
    } else {
      // Manual assignment by admin
      result = await manualAssignAgent(orderId, agentId, {
        id: session.userId,
        name: session.name,
        role: session.role,
      });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Agent assignment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign delivery agent." },
      { status: 500 }
    );
  }
}
