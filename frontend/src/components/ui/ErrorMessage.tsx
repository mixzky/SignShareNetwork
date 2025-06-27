import React from "react";

export default function ErrorMessage({ message, className = "" }: { message: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 ${className}`} role="alert" aria-label="Error">
      <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414 1.414M12 8v4m0 4h.01" />
        <circle cx="12" cy="12" r="10" />
      </svg>
      <span>{message}</span>
    </div>
  );
} 