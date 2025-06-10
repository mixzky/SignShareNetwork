"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../utils/supabase/server";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { error } from "console";
import { data } from "motion/react-client";
import { createUserProfile, getUserProfile } from "../lib/supabase";

export async function getUserSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return { status: "success", user: data.user };
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const credentials = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: credentials.username,
      },
    },
  });

  if (error) {
    return {
      status: error?.message,
      user: null,
    };
  } else if (data?.user?.identities?.length === 0) {
    return {
      status: "User with this email already exists, please login",
      user: null,
    };
  }

  if (data && data.user) {
    try {
      const userId = data.user.id;
      const username = credentials.username;
      await createUserProfile(userId, username);
      console.log(`Profile created automatically for new user: ${userId}`);
    } catch (profileError) {
      console.error("Error creating user profile during sign-up:", profileError);
    }
  }

  revalidatePath("/", "layout");
  return { status: "success", user: data.user };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return {
      status: error?.message,
      user: null,
    };
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", credentials?.email)
    .limit(1)
    .single();

  if (!existingUser) {
    const { error: insertError } = await supabase.from("users").insert({
      email: data?.user.email,
      username: data?.user?.user_metadata?.username,
    });
    if (insertError) {
      return {
        status: insertError?.message,
        user: null,
      };
    }
  }

  revalidatePath("/", "layout");
  return { status: "success", user: data.user };
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { error, data } = await supabase.auth.resetPasswordForEmail(
    formData.get("email") as string,
    {
      redirectTo: `${origin}/reset-password`,
    }
  );

  if (error) {
    return { status: error?.message };
  }
  return { status: "success" };
}

export async function resetPassword(formData: FormData, code: string) {
  const supabase = await createClient();
  const { error: CodeError } = await supabase.auth.exchangeCodeForSession(code);

  if (CodeError) {
    return { status: CodeError?.message };
  }

  const { error } = await supabase.auth.updateUser({
    password: formData.get("password") as string,
  });

  if (error) {
    return { status: error?.message };
  }

  return { status: "success" };
}

export async function signInWithGoogle() {
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/error");
  } else if (data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const existingProfile = await getUserProfile(user.id);
        if (!existingProfile) {
          const username = user.user_metadata?.email?.split('@')[0] || user.email?.split('@')[0] || user.id;
          const displayName = user.user_metadata?.full_name || user.user_metadata?.name || username;

          console.log(`*** DEBUG: Creating profile for Google user. userId: ${user.id}, username: ${username}, displayName: ${displayName}`);

          await createUserProfile(user.id, username, { display_name: displayName });
          console.log(`Profile created automatically for Google user: ${user.id}`);
        } else {
          console.log(`Profile already exists for Google user: ${user.id}`);
        }
      } catch (profileError) {
        console.error("Error ensuring user profile for Google sign-in:", profileError);
      }
    }
    return redirect(data.url);
  }
}
