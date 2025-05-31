import { verifyRequest } from "@/lib/shopify/verify";
import { NextResponse } from "next/server";

export type APIResponse<DataType> = {
  status: "success" | "error";
  data?: DataType;
  message?: string;
};

type Data = {
  name: string;
  height: string;
};

export async function GET(req: Request) {
  // session token is located in the request headers
  const validSession = await verifyRequest(req, false); // Use offline sessions for consistency with GraphQL API
  console.log("validSession", validSession);

  return NextResponse.json<APIResponse<Data>>({
    status: "success",
    data: {
      name: "Luke Skywalker",
      height: "172",
    },
  });
}
