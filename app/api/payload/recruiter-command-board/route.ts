import { NextResponse } from "next/server";
import { getTouchpointBoardPayload } from "@/lib/payload-builder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const payload = await getTouchpointBoardPayload();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to build touchpoint payload";

    return NextResponse.json(
      {
        object: "error",
        code: "PAYLOAD_BUILD_FAILED",
        message,
      },
      { status: 500 }
    );
  }
}

