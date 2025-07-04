import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // --- BEGIN: Use getUser() for secure authentication and authorization ---
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  let userData = null;

  if (user) {
    const { data: fetchedUserData, error: userProfileError } = await supabase
      .from("users")
      .select("id, banned, is_disabled, role, display_name, username, email")
      .eq("id", user.id)
      .single();

    if (userProfileError) {
      console.error("Error fetching user profile:", userProfileError);
    } else {
      userData = fetchedUserData;
    }

    if (userData?.banned === true || userData?.is_disabled === true) {
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.nextUrl.origin);
      loginUrl.searchParams.set(
        "error",
        "Your account has been disabled. Please contact support for more information."
      );
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set({
        name: 'sb-access-token',
        value: '',
        path: '/',
        maxAge: 0
      });
      response.cookies.set({
        name: 'sb-refresh-token',
        value: '',
        path: '/',
        maxAge: 0
      });
      return response;
    }

    if (!userData) {
      try {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: user.id,
              display_name: user.email?.split("@")[0] || "User",
              role: "user",
              banned: false,
              is_disabled: false,
              username: user.email?.split("@")[0] || "user_" + Date.now(),
              email: user.email,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        userData = newUser;
      } catch (error) {
        console.error("Error creating user profile:", error);
      }
    }

    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!userData || (userData.role !== "admin" && userData.role !== "moderator")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  } else if (getUserError) {
    await supabase.auth.signOut();
  }

  const protectedRoutes = ["/profile", "/profile/edit", "/upload", "/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const authRoutes = ["/login", "/register", "/forgot-password"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
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
