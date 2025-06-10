"use client"
import React, { useState } from "react"
import AuthButton from "./AuthButton"
import { useRouter } from "next/navigation"
import { signUp } from "@/actions/auth";

const SignUpForm = () => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [touched, setTouched] = useState<{ username: boolean; email: boolean; password: boolean }>({ username: false, email: false, password: false });
    const router = useRouter();

    const validateUsername = (value: string) => value.length >= 3;
    const validateEmail = (value: string) => /.+@.+\..+/.test(value);
    const validatePassword = (value: string) => value.length >= 6;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setTouched({ username: true, email: true, password: true });
        if (!validateUsername(username) || !validateEmail(email) || !validatePassword(password)) return;
        setError(null);
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await signUp(formData);
        if(result.status === "success") {
            router.push("/");
        }else{
            setError(result.status);
        }
        setLoading(false);
    };

    return (
        <div className="w-full">
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 bg-white/90 rounded-xl shadow-lg p-8 border border-gray-100" autoComplete="on">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="Username"
                id="username"
                name="username"
                className={`mt-1 w-full px-4 py-2 h-11 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white transition ${touched.username && !validateUsername(username) ? 'border-red-400' : 'border-gray-200'}`}
                value={username}
                onChange={e => setUsername(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, username: true }))}
                required
                autoComplete="username"
              />
              {touched.username && !validateUsername(username) && (
                <p className="text-xs text-red-500 mt-1">Username must be at least 3 characters.</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                id="email"
                name="email"
                className={`mt-1 w-full px-4 py-2 h-11 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white transition ${touched.email && !validateEmail(email) ? 'border-red-400' : 'border-gray-200'}`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                required
                autoComplete="email"
              />
              {touched.email && !validateEmail(email) && (
                <p className="text-xs text-red-500 mt-1">Please enter a valid email address.</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                  id="password"
                  className={`mt-1 w-full px-4 py-2 h-11 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white transition ${touched.password && !validatePassword(password) ? 'border-red-400' : 'border-gray-200'}`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M17.94 17.94A9.97 9.97 0 0 1 12 19c-5.4 0-9-7-9-7a17.6 17.6 0 0 1 4.06-5.94M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .42-.09.82-.24 1.18"/><path stroke="currentColor" strokeWidth="2" d="m3 3 18 18"/></svg>
                  )}
                </button>
              </div>
              {touched.password && !validatePassword(password) && (
                <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters.</p>
              )}
            </div>
            <div className="mt-2">
              <AuthButton type="Sign up" loading={loading} />
            </div>
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </form>
        </div>
      );
    };
    
    export default SignUpForm;