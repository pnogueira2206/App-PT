import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isTrainerRoute = nextUrl.pathname.startsWith("/trainer");
  const isStudentRoute = nextUrl.pathname.startsWith("/student");
  const isLoginRoute = nextUrl.pathname === "/login";

  if (isLoginRoute) {
    if (isLoggedIn) {
      const dest = role === "TRAINER" ? "/trainer" : "/student";
      return NextResponse.redirect(new URL(dest, nextUrl));
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
