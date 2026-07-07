import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Simple in-memory rate limiting store (reset every minute)
const rateLimitStore = new Map<string, number>();

// Reset rate limit store every minute
setInterval(() => {
  rateLimitStore.clear();
}, 60 * 1000);

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Simple rate limiting per IP per minute.
 * Development: 500 req/min — Production: 100 req/min
 */
const RATE_LIMIT =
  process.env.NODE_ENV === "development" ? 500 : 100;

function checkRateLimit(ip: string): boolean {
  const key = `rate-limit:${ip}`;
  const count = rateLimitStore.get(key) || 0;

  if (count >= RATE_LIMIT) {
    return false;
  }

  rateLimitStore.set(key, count + 1);
  return true;
}

function isMutationMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

/**
 * Same-origin validation for mutation requests.
 * NextAuth already performs its own CSRF checks for /api/auth/* routes,
 * so we only enforce origin checks for the rest of the app APIs.
 */
function validateMutationOrigin(request: NextRequest): boolean {
  const method = request.method;

  if (!isMutationMethod(method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const requestOrigin = request.nextUrl.origin;

  if (origin) {
    return origin === requestOrigin;
  }

  if (referer) {
    return referer.startsWith(requestOrigin);
  }

  // Allow non-browser callers that omit origin headers.
  return true;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check rate limiting for all requests
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests" }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": "60",
        },
      }
    );
  }

  const isAuthApiRoute = pathname.startsWith("/api/auth/");

  // NextAuth handles its own CSRF. Other app APIs must be same-origin for mutations.
  if (
    pathname.startsWith("/api/") &&
    !isAuthApiRoute &&
    !validateMutationOrigin(request)
  ) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid request origin" }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      }
    );
  }

  // Protect /admin/* routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check for admin role
    const roles = token.roles as string[] | undefined;
    if (!roles || !roles.includes("admin")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - admin role required" }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        }
      );
    }
  }

  // Protect /account/* routes
  if (pathname.startsWith("/account")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/admin/* routes
  if (pathname.startsWith("/api/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - authentication required" }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Check for admin role
    const roles = token.roles as string[] | undefined;
    if (!roles || !roles.includes("admin")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - admin role required" }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        }
      );
    }
  }

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set("x-ratelimit-limit", String(RATE_LIMIT));
  response.headers.set(
    "x-ratelimit-remaining",
    String(RATE_LIMIT - (rateLimitStore.get(`rate-limit:${clientIp}`) || 0))
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
