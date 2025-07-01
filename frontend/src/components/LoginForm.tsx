"use client";
import React, { useState, useEffect, useRef } from "react";
import AuthButton from "./AuthButton";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/actions/auth";
import { Eye, EyeOff } from "lucide-react";
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
    console.log('Error message from URL:', errorMessage);
    
    if (errorMessage) {
      console.log('Showing error toast:', errorMessage);
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
      console.log('Attempting login for email:', formData.get("email"));
      
      const result = await signIn(formData);
      console.log('Login result:', result);
      
      if (result.status === "success") {
        router.push("/");
      } else {
        setError(result.status);
        toast.error(result.status || "An error occurred during login");
        // Clear password field on error
        if (formRef.current) {
          const passwordInput = formRef.current.querySelector('input[name="password"]') as HTMLInputElement;
          if (passwordInput) {
            passwordInput.value = '';
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred');
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      <form ref={formRef} onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200">
            Email
          </label>
          <input
            type="email"
            placeholder="Email"
            id="Email"
            name="email"
            className="mt-1 w-full px-4 p-2 h-10 rounded-md border border-gray-200 bg-white text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
              id="password"
              className="mt-1 w-full px-4 p-2 h-10 rounded-md border border-gray-200 bg-white text-sm text-gray-700"
            />
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <AuthButton type="login" loading={loading} />
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
};

export default LoginForm;