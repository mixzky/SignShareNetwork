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
      aria-busy={loading}
      aria-disabled={loading}
      aria-label={`${type} ${loading ? 'in progress' : 'button'}`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <span className="sr-only">Loading...</span>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </span>
      ) : (
        type
      )}
    </button>
  );
};

export default AuthButton;
