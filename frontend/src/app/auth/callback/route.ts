import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "../../../utils/supabase/server";
import { createUserProfile, getUserProfile } from "../../../lib/supabase"; // Import necessary functions

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // After session is established, check/create user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const existingProfile = await getUserProfile(user.id);
          if (!existingProfile) {
            // Derive username and display name from user_metadata or email
            const username = user.user_metadata?.email?.split('@')[0] || user.email?.split('@')[0] || user.id;
            const displayName = user.user_metadata?.full_name || user.user_metadata?.name || username;
            
            console.log(`*** DEBUG: Creating profile from auth/callback for Google user. userId: ${user.id}, username: ${username}, displayName: ${displayName}`);
            await createUserProfile(user.id, username, { display_name: displayName });
            console.log(`Profile created automatically for Google user in auth/callback: ${user.id}`);
          } else {
            console.log(`Profile already exists for Google user in auth/callback: ${user.id}`);
          }
        } catch (profileError) {
          console.error("Error ensuring user profile for Google sign-in in auth/callback:", profileError);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
