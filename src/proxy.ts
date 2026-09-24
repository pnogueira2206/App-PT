import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const papel = req.auth?.user?.papel;

  if (nextUrl.pathname === "/login") {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
    return;
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/admin") && papel !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/nova-avaliacao") && papel === "TREINADOR") {
    return NextResponse.redirect(new URL("/historico", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon.*|apple-touch-icon.*|logo-cfa.*).*)"],
};
