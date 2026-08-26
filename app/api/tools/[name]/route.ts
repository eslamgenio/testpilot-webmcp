import { invokeTool } from "@/src/server/tool-handler";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  let input: unknown = {};
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }
  const response = await invokeTool(name, input);
  return NextResponse.json(response.body, {
    status: response.status,
    headers: { "Cache-Control": "no-store" },
  });
}
