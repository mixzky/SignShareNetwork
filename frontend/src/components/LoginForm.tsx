"use client";
import React, { useState, useEffect, useRef } from "react";
import AuthButton from "./AuthButton";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/actions/auth";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const errorMessage = searchParams.get("error");
    console.log("Error message from URL:", errorMessage);

    if (errorMessage) {
      console.log("Showing error toast:", errorMessage);
      toast.error(errorMessage);

      // Clear the error from URL without navigating
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      console.log("Attempting login for email:", formData.get("email"));

      const result = await signIn(formData);
      console.log("Login result:", result);
      console.log("Result status type:", typeof result.status);
      console.log("Result status value:", JSON.stringify(result.status));

      if (result.status === "success") {
        console.log("Login successful, redirecting...");
        router.push("/");
      } else {
        console.log("Login failed with status:", result.status);
        setError(result.status);
        toast.error(result.status || "An error occurred during login");
        // Clear password field on error
        if (formRef.current) {
          const passwordInput = formRef.current.querySelector(
            'input[name="password"]'
          ) as HTMLInputElement;
          if (passwordInput) {
            passwordInput.value = "";
          }
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred");
      setError("An unexpected error occurred");
    }

    setLoading(false);
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="w-full flex flex-col gap-5"
        aria-label="Login form"
      >
        {/* Email Field */}
        <div className="space-y-2" role="group" aria-labelledby="email-label">
          <label
            id="email-label"
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <Mail className="inline w-4 h-4 mr-2" aria-hidden="true" />
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email address"
            id="email"
            name="email"
            required
            aria-required="true"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "login-error" : undefined}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2" role="group" aria-labelledby="password-label">
          <label
            id="password-label"
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <Lock className="inline w-4 h-4 mr-2" aria-hidden="true" />
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              name="password"
              id="password"
              required
              aria-required="true"
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "login-error" : undefined}
              className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none focus:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Eye className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <AuthButton type="login" loading={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
            id="login-error"
          >
            <p className="text-red-700 text-sm flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2" aria-hidden="true"></span>
              {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
