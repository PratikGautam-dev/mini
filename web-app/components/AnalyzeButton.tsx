"use client";

import { analyzeCase } from "@/app/actions/analyze";
import { Loader2, Play } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnalyzeButton({ caseId }: { caseId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await analyzeCase(caseId);
            if (result.success) {
                router.refresh();
            } else {
                alert("Analysis failed: " + result.error);
            }
        } catch (error) {
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                </>
            ) : (
                <>
                    <Play className="h-4 w-4" />
                    Run Analysis
                </>
            )}
        </button>
    );
}
