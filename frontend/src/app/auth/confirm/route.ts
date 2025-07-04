import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/";

    if (!token_hash || !type) {
      return NextResponse.redirect(new URL("/error", request.url));
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      console.error("Email confirmation error:", error);
      return NextResponse.redirect(new URL("/error", request.url));
    }

    // Successful verification
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error("Unexpected error during email confirmation:", error);
    return NextResponse.redirect(new URL("/error", request.url));
  }
}
