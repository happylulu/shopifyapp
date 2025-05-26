import { verifyRequest } from "@/lib/shopify/verify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await verifyRequest(req, true);
  return NextResponse.json({ message: "Authenticated call successful" });
}
