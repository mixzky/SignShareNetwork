import React from "react";

const AuthButton = ({
  type,
  loading,
}: {
  type: "login" | "Sign up" | "Reset Password" | "Forgot Password";
  loading: boolean;
}) => {
  return (
    <button
      disabled={loading}
      type="submit"
      className={`w-full px-6 py-3 rounded-lg text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        loading
          ? "bg-slate-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
      }`}
    >
      {loading ? "Loading..." : type}
    </button>
  );
};

export default AuthButton;
