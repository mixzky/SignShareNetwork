import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "../../../utils/supabase/server";
import { toast } from "sonner";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = request.headers.get("origin") || `https://${request.headers.get("host")}`;
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
      const {data: {user}, error: userError} = await supabase.auth.getUser();

      if(!userError && user){
        // First check if user exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, avatar_url")
          .eq("id", user.id)
          .single();

        // Get the avatar URL from Google auth or existing URL
        const avatarUrl = user.user_metadata?.avatar_url || existingUser?.avatar_url;

        if (!existingUser) {
          // Create new user
          const { error: insertError } = await supabase.from("users").insert([
            {
              id: user.id,
              email: user.email,
              username: user.user_metadata?.name || user.email?.split('@')[0],
              display_name: user.user_metadata?.name || user.email?.split('@')[0],
              avatar_url: avatarUrl
            }
          ]);

          if(insertError) {
            console.error("Insert error:", insertError.message);
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
          }
        } else {
          // Update existing user with latest Google avatar if available
          if (user.user_metadata?.avatar_url && user.user_metadata.avatar_url !== existingUser.avatar_url) {
            const { error: updateError } = await supabase
              .from("users")
              .update({ avatar_url: user.user_metadata.avatar_url })
              .eq("id", user.id);

            if(updateError) {
              console.error("Update error:", updateError.message);
            }
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
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