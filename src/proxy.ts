import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js 16 Proxy (formerly middleware).
 * Responsibilities:
 *  1. Refresh the Supabase auth session cookie on every request.
 *  2. Redirect unauthenticated users away from protected routes.
 *  3. Redirect authenticated users away from /login and /signup.
 *
 * IMPORTANT: This proxy only handles session refresh + coarse-grained routing.
 * Fine-grained role authorization is enforced inside each Server Component
 * via requireRole() from @/lib/auth — never rely on this proxy alone.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client that can read/write cookies in proxy context
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to the request (so downstream can see them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild response so new cookies are forwarded to the browser
          response = NextResponse.next({
            request,
          });
          // Set cookies on the response
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Calling getUser() refreshes the session token if needed.
  // This is the recommended pattern from @supabase/ssr.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student");

  const isAuthRoute =
    pathname === "/login" || pathname === "/signup";

  // Unauthenticated user trying to access a protected route → /login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated user with an active role trying to access login/signup → redirect to root
  // (root page redirects them to their role dashboard)
  const hasActiveRole = request.cookies.has("active_role");
  if (user && hasActiveRole && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
