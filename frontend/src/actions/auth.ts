"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "../../utils/supabase/server"
import { headers } from "next/headers"

export async function signup(formData: FormData) {
    const supabase = await createClient();
    
    const Credential = {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const {error, data} = await supabase.auth.signUp({
        email: Credential.email,
        password: Credential.password,
        options: {
            data: {
                username: Credential.username,
            },
        },

    });

    if(error) {
        return {
            status: error?.message,
            user: null
        };
    } else if( data?.user?.identities?.length === 0) {
        return {
            status: "User with this email already exists, please login",
            user: null,
        };
    }

    revalidatePath("/", "layout");
    return {status: "success", user: data.user};
}