import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/auth/auth";

export default async function proxy(request: NextRequest) {
  const session = await getSession();

  const isSigninPage = request.nextUrl.pathname.startsWith("/sign-in");
  const isSignupPage = request.nextUrl.pathname.startsWith("/sign-up");
  if ((isSigninPage || isSignupPage) && session?.user) {
    return Response.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}
