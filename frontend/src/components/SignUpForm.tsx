"use client";
import React, { useState } from "react";
import AuthButton from "./AuthButton";
import { useRouter } from "next/navigation";
import { signUp } from "@/actions/auth";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
}

const SignUpForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const router = useRouter();

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "username":
        if (!value.trim()) return "Username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
        if (value.length > 20)
          return "Username must be less than 20 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(value))
          return "Username can only contain letters, numbers, and underscores";
        break;
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Please enter a valid email address";
        break;
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
          return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
        break;
    }
    return undefined;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear general error
    if (error) setError(null);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) errors[key as keyof FieldErrors] = error;
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const formDataObj = new FormData(event.currentTarget);
    const result = await signUp(formDataObj);

    if (result.status === "success") {
      router.push("/");
    } else {
      setError(result.status);
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        {/* Username Field */}
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <User className="inline w-4 h-4 mr-2" />
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter your username"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                fieldErrors.username
                  ? "border-red-300 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 focus:border-blue-500"
              }`}
            />
          </div>
          {fieldErrors.username && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              {fieldErrors.username}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <Mail className="inline w-4 h-4 mr-2" />
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="Enter your email address"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                fieldErrors.email
                  ? "border-red-300 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 focus:border-blue-500"
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <Lock className="inline w-4 h-4 mr-2" />
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a secure password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                fieldErrors.password
                  ? "border-red-300 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 focus:border-blue-500"
              }`}
            />
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none focus:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              {fieldErrors.password}
            </p>
          )}
          <div className="text-xs text-slate-500 mt-1">
            Password must contain at least 8 characters with uppercase,
            lowercase, and numbers.
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <AuthButton type="Sign up" loading={loading} />
        </div>

        {/* General Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default SignUpForm;
