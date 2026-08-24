import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "./app/lib/firebaseAdmin";

const PROTECTED_PATHS = [
  "/dashboard",
  "/invoices",
  "/clients",
  "/analytics",
  "/expenses",
  "/items",
  "/gstr",
  "/recurring",
  "/profile",
  "/settings",
];

const isProtectedRoute = (pathname: string) =>
  PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const session = req.cookies.get("__session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await adminAuth.verifySessionCookie(session, true);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
