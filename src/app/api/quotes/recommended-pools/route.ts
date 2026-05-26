import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    recommendedPools: [],
    note: "Matching endpoint scaffold. Connect Prisma query in Sprint 1."
  });
}
