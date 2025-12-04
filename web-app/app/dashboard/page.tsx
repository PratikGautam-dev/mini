import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";

async function getCases(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            cases: {
                orderBy: { createdAt: "desc" },
                include: { analysis: true }
            }
        }
    });
    return user?.cases || [];
}

export default async function Dashboard() {
    const session = await getServerSession();
    if (!session?.user?.email) return null;

    const cases = await getCases(session.user.email);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Cases</h1>
                    <p className="text-zinc-400">Manage and track your missing person reports.</p>
                </div>
                <Link
                    href="/dashboard/submit"
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Case
                </Link>
            </div>

            {cases.length === 0 ? (
                <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
                        <Plus className="h-8 w-8 text-zinc-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No cases yet</h3>
                    <p className="mt-2 text-zinc-400">Submit your first case to start the search.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {cases.map((c) => (
                        <div
                            key={c.id}
                            className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${c.status === 'SOLVED' ? 'border-green-500/20 bg-green-500/10 text-green-400' :
                                        c.status === 'ANALYZING' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                                            'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                                    }`}>
                                    {c.status}
                                </div>
                                <span className="text-xs text-zinc-500">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="mb-2 text-lg font-semibold">{c.title}</h3>
                            <p className="mb-4 text-sm text-zinc-400 line-clamp-2">
                                {c.description || "No description provided."}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-zinc-700"></div>
                                    Missing: {c.missingPersonName}
                                </div>
                            </div>

                            {c.analysis && (
                                <div className="mt-4 border-t border-zinc-800 pt-4">
                                    <p className="text-xs text-zinc-400">
                                        Top Match Confidence: <span className="text-white font-mono">{(c.analysis.topMatch! * 100).toFixed(1)}%</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
