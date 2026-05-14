import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_SESSION_COOKIE } from "@/lib/public-auth.config";

export async function GET(request: NextRequest) {
    const redirectTo =
        request.nextUrl.searchParams.get("redirect") || "/";
    const response = NextResponse.redirect(
        new URL(redirectTo, request.url),
    );
    response.cookies.delete(PUBLIC_SESSION_COOKIE);
    return response;
}
