import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is authenticated, check if they're banned or disabled
  if (session?.user) {
    const { data: userData, error } = await supabase
      .from('users')
      .select('banned, is_disabled')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error checking user status:', error);
      // If there's an error checking the status, let them through but log the error
      return res;
    }

    if (userData?.banned || userData?.is_disabled) {
      // If user is banned or disabled, sign them out and redirect to login with message
      await supabase.auth.signOut();
      
      // Create a URL with an error message
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'Your account has been disabled. Please contact support for more information.');
      
      return NextResponse.redirect(redirectUrl);
    }

    // If user doesn't have a profile yet, create one
    if (!userData) {
      try {
        await supabase
          .from('users')
          .insert([
            {
              id: session.user.id,
              display_name: session.user.email?.split('@')[0] || 'User',
              role: 'user',
              banned: false,
              is_disabled: false,
              username: session.user.email?.split('@')[0] || 'user_' + Date.now(),
              email: session.user.email
            }
          ]);
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = ["/profile", "/profile/edit", "/upload"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Auth routes that should redirect to home if user is already logged in
  const authRoutes = ["/login", "/register", "/forgot-password"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!session && isProtectedRoute) {
    // Redirect to login if accessing protected route without session
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isAuthRoute) {
    // Redirect to home if accessing auth routes while logged in
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check user role for admin routes
    const { data: userRole } = await supabase
      .from("users")
      .select("role")
      .eq("id", session?.user?.id)
      .single();

    if (
      !userRole ||
      (userRole.role !== "admin" && userRole.role !== "moderator")
    ) {
      // Redirect to home if user doesn't have required role
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
