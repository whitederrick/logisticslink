import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    recommendedPools: [],
    note: "Use GET /api/quotes/:id/recommended-pools for database-backed recommendations."
  });
}
