import LoginForm from "@/components/LoginForm";
import LoginGoogle from "@/components/LoginGoogle";
import Link from "next/link";
import { ArrowLeft, Home, LogIn } from "lucide-react";

export default function LoginPage() {
  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background:
            "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #faf5ff 100%)",
        }}
      >
        <div className="w-full max-w-md">
          {/* Navigation Links */}
          <div className="flex justify-between items-center mb-8">
            <Link
              href="/"
              className="flex items-center text-sm text-slate-600 hover:text-slate-800 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            <Link
              href="/"
              className="flex items-center text-sm text-slate-600 hover:text-slate-800 transition-colors group"
            >
              <Home className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
              Home
            </Link>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Sign in
              </h1>
              <p className="text-slate-600 text-sm">
                Welcome back! Please sign in to your account to continue.
              </p>
            </div>

            <LoginForm />
            <LoginGoogle />

            {/* Navigation Links */}
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
              <div className="text-center">
                <span className="text-sm text-slate-600">
                  {`Don't have an account?`}{" "}
                </span>
                <Link
                  className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                  href="/register"
                >
                  Sign Up
                </Link>
              </div>
              <div className="text-center">
                <span className="text-sm text-slate-600">
                  {`Forgot your password?`}{" "}
                </span>
                <Link
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  href="/forgot-password"
                >
                  Reset Password
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
