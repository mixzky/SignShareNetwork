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
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
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

  let userData = null; // This will store the user's profile data from your 'users' table

  if (user) {
    // If a user object is returned, it means the session is authentic and verified by Supabase Auth server.
    console.log('Authenticated user:', user.email);
    const { data: fetchedUserData, error: userProfileError } = await supabase
      .from("users")
      .select("id, banned, is_disabled, role, display_name, username, email")
      .eq("id", user.id)
      .single();

    console.log('Fetched user data:', fetchedUserData);

    if (userProfileError) {
      console.error("Error fetching user profile:", userProfileError);
    } else {
      userData = fetchedUserData;
    }

    // Check if user is banned or disabled (using the securely fetched userData)
    if (userData?.banned === true || userData?.is_disabled === true) {
      console.log('User is banned or disabled. Signing out and redirecting...');
      await supabase.auth.signOut();
      
      // Force a new response instead of modifying the existing one
      const response = NextResponse.redirect(new URL("/login", request.nextUrl.origin));
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
      
      // Add the error message
      const loginUrl = new URL("/login", request.nextUrl.origin);
      loginUrl.searchParams.set(
        "error",
        "Your account has been disabled. Please contact support for more information."
      );
      console.log('Redirecting to:', loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }

    // If user doesn't have a profile yet in your 'users' table, create one.
    if (!userData) {
      console.log('No user data found, creating profile for:', user.email);
      try {
        await supabase.from("users").insert([
          {
            id: user.id, // Use user.id from the authentic getUser()
            display_name: user.email?.split("@")[0] || "User",
            role: "user", // Default role
            banned: false,
            is_disabled: false,
            username: user.email?.split("@")[0] || "user_" + Date.now(),
            email: user.email,
          },
        ]);
        // After successful insertion, update userData so subsequent checks in this request are accurate
        userData = {
          id: user.id,
          display_name: user.email?.split("@")[0] || "User",
          role: "user",
          banned: false,
          is_disabled: false,
          username: user.email?.split("@")[0] || "user_" + Date.now(),
          email: user.email,
        };
      } catch (error) {
        console.error("Error creating user profile:", error);
        // Consider signing out or redirecting if profile creation fails critically
      }
    }

    // Admin/Moderator access check (using the securely fetched userData.role)
    if (request.nextUrl.pathname.startsWith("/admin")) {
      // Ensure userData exists and has a role, and that the role is 'admin' or 'moderator'
      if (
        !userData ||
        (userData.role !== "admin" && userData.role !== "moderator")
      ) {
        return NextResponse.redirect(new URL("/", request.url)); // Redirect to home if not authorized
      }
    }
  } else if (getUserError) {
    // If getUser() returns an error, it often means the session is invalid or expired.
    console.warn(
      "Supabase getUser() failed, likely an invalid or expired session:",
      getUserError.message
    );
    // You might want to sign out to clear potentially bad cookies.
    await supabase.auth.signOut();
  }
  // --- END: Use getUser() for secure authentication and authorization ---

  // --- Route Protection based on authenticated 'user' status ---
  const protectedRoutes = [
    "/profile",
    "/profile/edit",
    "/upload",
    "/dashboard",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const authRoutes = ["/login", "/register", "/forgot-password"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If no authentic user and trying to access a protected route, redirect to login
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If authentic user and trying to access an auth route, redirect to home
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If no authentic user and trying to access /admin (which wasn't caught by protectedRoutes if not listed there)
  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url)); // Or to home, based on preference
  }

  return response; // Continue to the requested page
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
