import { getQaService } from "@/src/server/services";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const qaService = await getQaService();
  const state = await qaService.getDashboardSnapshot("2.4");
  return NextResponse.json(
    { success: true, data: state },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
