import { NextResponse } from "next/server";
import { activeService, platform } from "@/lib/product";

export function GET() {
  return NextResponse.json({
    ok: true,
    platform: platform.name,
    service: activeService.code,
    timestamp: new Date().toISOString()
  });
}
