import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isTrainerRoute = nextUrl.pathname.startsWith("/trainer");
  const isStudentRoute = nextUrl.pathname.startsWith("/student");
  const isLoginRoute = nextUrl.pathname === "/login";

  if (isLoginRoute) {
    if (isLoggedIn) {
      // "/" sends the gym TV's old Chrome to TV mode instead of the dashboard.
      const dest = role === "TRAINER" ? "/" : "/student";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }
    // The gym TV's old Chrome (76) breaks on the app's JS and blanks the page;
    // the login form works without JS, so block scripts there.
    const chrome = req.headers.get("user-agent")?.match(/Chrome\/(\d+)/);
    if (chrome && Number(chrome[1]) < 100) {
      const res = NextResponse.next();
      res.headers.set("Content-Security-Policy", "script-src 'none'");
      return res;
    }
    return;
  }

  if (isTrainerRoute || isStudentRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (isTrainerRoute && role !== "TRAINER") {
      return NextResponse.redirect(new URL("/student", nextUrl));
    }
    if (isStudentRoute && role !== "STUDENT") {
      return NextResponse.redirect(new URL("/trainer", nextUrl));
    }
  }
});

export const config = {
  matcher: ["/trainer/:path*", "/student/:path*", "/login"],
};
