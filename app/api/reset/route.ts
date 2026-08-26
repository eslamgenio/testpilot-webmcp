import { getQaService } from "@/src/server/services";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const qaService = await getQaService();
  const result = await qaService.resetDemo();
  return NextResponse.json(
    { success: true, data: result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
