import { NextRequest, NextResponse } from "next/server";

// Redirect /auth/callback to /api/auth/callback for consistency
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  
  // Redirect to the API auth callback with all query parameters
  const redirectUrl = `/api/auth/callback${queryString ? `?${queryString}` : ''}`;
  
  return NextResponse.redirect(new URL(redirectUrl, request.url));
} 