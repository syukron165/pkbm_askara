import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const start = Date.now();
    
    // Simple query to ensure DB is connected
    await db.$queryRaw`SELECT 1`;
    
    const duration = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      latencyMs: duration,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    }, { status: 503 });
  }
}
