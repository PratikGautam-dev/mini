import Link from "next/link";
import { Shield, LayoutDashboard, PlusCircle, LogOut, Settings } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession();

    if (!session) {
        redirect("/auth/signin");
    }

    return (
        <div className="flex min-h-screen bg-black text-white">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                <div className="flex h-16 items-center border-b border-zinc-800 px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <Shield className="h-6 w-6 text-blue-500" />
                        <span>FindSafe</span>
                    </Link>
                </div>

                <div className="flex flex-col justify-between h-[calc(100vh-64px)] p-4">
                    <nav className="space-y-2">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                            <LayoutDashboard className="h-5 w-5" />
                            Dashboard
                        </Link>
                        <Link
                            href="/dashboard/submit"
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                            <PlusCircle className="h-5 w-5" />
                            Submit Case
                        </Link>
                        {/* Admin Only Link */}
                        {/* @ts-ignore */}
                        {(session?.user?.role === "ADMIN" || session?.user?.email?.includes("admin") || session?.user?.email === "pratik@gmail.com") && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
                            >
                                <Shield className="h-5 w-5" />
                                Admin Console
                            </Link>
                        )}
                    </nav>

                    <div className="space-y-2 border-t border-zinc-800 pt-4">
                        <div className="px-4 py-2">
                            <p className="text-xs font-medium text-zinc-500">Signed in as</p>
                            <p className="truncate text-sm font-medium text-white">{session.user?.email}</p>
                        </div>
                        <Link
                            href="/api/auth/signout"
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                <div className="mx-auto max-w-5xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
