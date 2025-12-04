import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import AnalyzeButton from "@/components/AnalyzeButton";
import { Clock, CheckCircle, AlertCircle, Calendar, User } from "lucide-react";

async function getCase(id: string) {
    return await prisma.case.findUnique({
        where: { id },
        include: {
            user: true,
            analysis: true
        }
    });
}

export default async function CaseDetail({ params }: { params: { id: string } }) {
    const c = await getCase(params.id);

    if (!c) {
        notFound();
    }

    let analysisData = null;
    if (c.analysis?.rawResult) {
        try {
            analysisData = JSON.parse(c.analysis.rawResult);
        } catch (e) {
            console.error("Failed to parse analysis result", e);
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${c.status === 'SOLVED' ? 'border-green-500/20 bg-green-500/10 text-green-400' :
                            c.status === 'ANALYZING' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                                'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                            }`}>
                            {c.status}
                        </span>
                    </div>
                    <p className="text-zinc-400">Case ID: {c.id}</p>
                </div>

                {c.status !== 'SOLVED' && (
                    <AnalyzeButton caseId={c.id} />
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Details & Media */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <h3 className="mb-4 text-lg font-semibold">Case Details</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-zinc-500">Missing Person</p>
                                <p className="font-medium">{c.missingPersonName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Reported By</p>
                                <p className="font-medium">{c.user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Date Reported</p>
                                <p className="font-medium">{new Date(c.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-zinc-500">Description</p>
                                <p className="text-zinc-300 mt-1">{c.description || "No description provided."}</p>
                            </div>
                        </div>
                    </div>

                    {/* Media Evidence */}
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <h3 className="font-medium text-zinc-400">Reference Photo</h3>
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-zinc-800 bg-black">
                                <Image
                                    src={c.refImage}
                                    alt="Reference"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium text-zinc-400">CCTV Footage</h3>
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-black">
                                <video
                                    src={c.video}
                                    controls
                                    className="h-full w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Analysis Results */}
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold">Analysis Results</h3>

                    {!c.analysis ? (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                                <Clock className="h-6 w-6 text-zinc-500" />
                            </div>
                            <p className="text-zinc-400">No analysis run yet.</p>
                            <p className="text-sm text-zinc-500">Click "Run Analysis" to start.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                                    <p className="text-xs text-zinc-500">Total Detections</p>
                                    <p className="text-xl font-bold">{analysisData?.statistics?.total_detections || 0}</p>
                                </div>
                                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                                    <p className="text-xs text-zinc-500">Matches Found</p>
                                    <p className="text-xl font-bold text-green-500">{analysisData?.statistics?.matches_found || 0}</p>
                                </div>
                            </div>

                            {/* Matches List */}
                            <div className="space-y-4">
                                {analysisData?.matches?.map((match: any, i: number) => (
                                    <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-900">
                                        <div className="flex items-start gap-4">
                                            {/* Match Image */}
                                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-black">
                                                {match.image_base64 && (
                                                    <img
                                                        src={match.image_base64}
                                                        alt={`Match ${i + 1}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-white">Match #{match.rank}</span>
                                                    <span className="text-sm font-mono text-green-400">
                                                        {(match.confidence * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500 mb-2">
                                                    Frame: {match.frame_number} • Time: {match.timestamp_seconds.toFixed(2)}s
                                                </p>
                                                <div className="h-1.5 w-full rounded-full bg-zinc-800">
                                                    <div
                                                        className="h-1.5 rounded-full bg-green-500"
                                                        style={{ width: `${match.confidence * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!analysisData?.matches || analysisData.matches.length === 0) && (
                                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500">
                                        No matches found above threshold.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
