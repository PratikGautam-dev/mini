import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Filter, ArrowRight } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getAllCases() {
    console.log("Admin: Fetching all cases...");
    const cases = await prisma.case.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: true,
            analysis: true
        }
    });
    console.log(`Admin: Found ${cases.length} cases.`);
    return cases;
}

export default async function AdminDashboard() {
    const cases = await getAllCases();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Case Management</h1>
                    <p className="text-zinc-400">Review and analyze reported cases.</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <p className="text-sm font-medium text-zinc-400">Total Cases</p>
                    <p className="text-3xl font-bold">{cases.length}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <p className="text-sm font-medium text-zinc-400">Pending Analysis</p>
                    <p className="text-3xl font-bold text-yellow-500">
                        {cases.filter(c => c.status === 'PENDING').length}
                    </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <p className="text-sm font-medium text-zinc-400">Solved</p>
                    <p className="text-3xl font-bold text-green-500">
                        {cases.filter(c => c.status === 'SOLVED').length}
                    </p>
                </div>
            </div>

            {/* Cases Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Case Details</th>
                                <th className="px-6 py-4 font-medium">Reported By</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {cases.map((c) => (
                                <tr key={c.id} className="hover:bg-zinc-900/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{c.title}</div>
                                        <div className="text-zinc-500">Missing: {c.missingPersonName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">{c.user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${c.status === 'SOLVED' ? 'border-green-500/20 bg-green-500/10 text-green-400' :
                                            c.status === 'ANALYZING' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                                                'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/admin/cases/${c.id}`}
                                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                                        >
                                            View
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
