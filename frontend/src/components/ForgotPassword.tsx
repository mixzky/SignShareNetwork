"use client";
import React, { useState } from "react";
import AuthButton from "./AuthButton";
import { forgotPassword } from "@/actions/auth";
import { Mail } from "lucide-react";

const ForgotPassword = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address";
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Clear errors when user starts typing
    if (emailError) setEmailError(null);
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleEmailBlur = () => {
    const emailValidationError = validateEmail(email);
    setEmailError(emailValidationError);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate email before submission
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const result = await forgotPassword(formData);

    if (result.status === "success") {
      setSuccess(
        "Password reset link sent to your email. Please check your inbox and spam folder."
      );
      setEmail(""); // Clear the form on success
    } else {
      setError(result.status);
    }

    setLoading(false);
  };
  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="Email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <Mail className="inline w-4 h-4 mr-2" />
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email address"
            id="Email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              emailError
                ? "border-red-300 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-200"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 focus:border-blue-500"
            }`}
          />
          {emailError && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              {emailError}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <AuthButton type="Forgot Password" loading={loading} />
        </div>

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {success}
            </p>
          </div>
        )}

        {/* Error Message */}
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

export default ForgotPassword;
