import Link from "next/link";
import { ArrowRight, Shield, Search, Users } from "lucide-react";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col bg-black text-white selection:bg-blue-500/30">
            {/* Navigation */}
            <nav className="container mx-auto flex items-center justify-between px-6 py-8">
                <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
                    <Shield className="h-8 w-8 text-blue-500" />
                    <span>FindSafe</span>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/auth/signin" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Sign In
                    </Link>
                    <Link
                        href="/auth/signin"
                        className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="absolute inset-0 -z-10 h-full w-full bg-black bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

                <div className="space-y-4">
                    <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-400 backdrop-blur-xl">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                        AI-Powered Re-Identification
                    </div>
                    <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                        Find Missing Persons <br /> with Precision
                    </h1>
                    <p className="max-w-2xl text-lg text-zinc-400">
                        Advanced computer vision pipeline to match reference photos against CCTV footage.
                        Helping authorities and families find their loved ones faster.
                    </p>
                </div>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <Link
                        href="/auth/signin"
                        className="group flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-blue-500"
                    >
                        Report a Case
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                        href="/about"
                        className="flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-black px-8 py-3 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-900"
                    >
                        How it Works
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="mt-24 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3 text-left">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
                        <Search className="mb-4 h-10 w-10 text-blue-500" />
                        <h3 className="mb-2 text-lg font-semibold">Smart Detection</h3>
                        <p className="text-sm text-zinc-400">
                            Uses YOLOv8 to detect persons in complex CCTV scenes with high accuracy.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
                        <Users className="mb-4 h-10 w-10 text-purple-500" />
                        <h3 className="mb-2 text-lg font-semibold">Identity Matching</h3>
                        <p className="text-sm text-zinc-400">
                            OSNet-IBN extracts deep features to match identities across different cameras.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
                        <Shield className="mb-4 h-10 w-10 text-green-500" />
                        <h3 className="mb-2 text-lg font-semibold">Secure & Private</h3>
                        <p className="text-sm text-zinc-400">
                            Data is processed locally and securely. Only authorized personnel can view results.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-900 py-6 text-center text-sm text-zinc-600">
                <p>© 2024 FindSafe AI. All rights reserved.</p>
            </footer>
        </div>
    );
}
