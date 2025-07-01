"use client"
import React, { useState, useRef } from "react"
import AuthButton from "./AuthButton"
import { useRouter } from "next/navigation"
import { signUp } from "@/actions/auth";
import { toast } from "sonner";

const SignUpForm = () => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState({
        username: "",
        email: "",
        password: ""
    });
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();

    const validateForm = () => {
        const form = formRef.current;
        if (!form) return false;

        const username = form.username.value;
        const email = form.email.value;
        const password = form.password.value;
        let isValid = true;
        const newErrors = {
            username: "",
            email: "",
            password: ""
        };

        if (!username) {
            newErrors.username = "Please enter username";
            isValid = false;
        }

        if (!email) {
            newErrors.email = "Please enter email address";
            isValid = false;
        }

        if (!password) {
            newErrors.password = "Please enter password";
            isValid = false;
        }

        setValidationErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setValidationErrors({
            username: "",
            email: "",
            password: ""
        });
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await signUp(formData);
        
        if(result.status === "success") {
            toast.success("Account created successfully!");
            router.push("/");
        }else{
            setError(result.status);
            toast.error(result.status || "An error occurred during sign up");
        }

        setLoading(false);
    };

    return (
        <div>
          <form ref={formRef} onSubmit={handleSubmit} className="w-full flex flex-col gap-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-200">
                Username
              </label>
              <input
                type="text"
                placeholder="Username"
                id="username"
                name="username"
                className={`mt-1 w-full px-4 p-2 h-10 rounded-md border ${
                    validationErrors.username ? 'border-red-500' : 'border-gray-200'
                } bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 ${
                    validationErrors.username ? 'focus:ring-red-200' : 'focus:ring-blue-200'
                }`}
              />
              {validationErrors.username && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200">
                Email
              </label>
              <input
                type="email"
                placeholder="Email"
                id="Email"
                name="email"
                className={`mt-1 w-full px-4 p-2 h-10 rounded-md border ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-200'
                } bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 ${
                    validationErrors.email ? 'focus:ring-red-200' : 'focus:ring-blue-200'
                }`}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                name="password"
                id="password"
                className={`mt-1 w-full px-4 p-2 h-10 rounded-md border ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-200'
                } bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 ${
                    validationErrors.password ? 'focus:ring-red-200' : 'focus:ring-blue-200'
                }`}
              />
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
              )}
            </div>
            <div className="mt-4">
              <AuthButton type="Sign up" loading={loading} />
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded-md border border-red-200">
                {error}
              </p>
            )}
          </form>
        </div>
      );
    };
    
    export default SignUpForm;