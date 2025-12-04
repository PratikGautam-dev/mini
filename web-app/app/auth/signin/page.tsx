"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, User, Lock } from "lucide-react";

export default function SignIn() {
    const router = useRouter();
    const [role, setRole] = useState<"USER" | "ADMIN">("USER");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid credentials");
            } else {
                router.push(role === "ADMIN" ? "/admin" : "/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (newRole: "USER" | "ADMIN") => {
        setRole(newRole);
        // Pre-fill for demo convenience
        if (newRole === "ADMIN") {
            setEmail("pratik@gmail.com");
            setPassword("123456");
        } else {
            setEmail("user@example.com");
            setPassword("password");
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
            <div className="absolute inset-0 -z-10 h-full w-full bg-black bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

            <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 backdrop-blur-xl">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                        <Shield className="h-6 w-6 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Select your role to continue
                    </p>
                </div>

                {/* Role Toggle */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-black p-1 border border-zinc-800">
                    <button
                        onClick={() => handleRoleChange("USER")}
                        className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${role === "USER"
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                    >
                        <User className="h-4 w-4" />
                        User
                    </button>
                    <button
                        onClick={() => handleRoleChange("ADMIN")}
                        className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${role === "ADMIN"
                                ? "bg-blue-600/20 text-blue-400 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                    >
                        <Lock className="h-4 w-4" />
                        Admin
                    </button>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-400">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-400">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed ${role === "ADMIN"
                                ? "bg-blue-600 hover:bg-blue-500 focus:ring-blue-500"
                                : "bg-zinc-700 hover:bg-zinc-600 focus:ring-zinc-500"
                            }`}
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            `Sign in as ${role === "ADMIN" ? "Admin" : "User"}`
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
