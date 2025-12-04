"use client";

import { submitCase } from "@/app/actions/cases";
import { Loader2, Upload, Video, Image as ImageIcon, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitCase() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            const result = await submitCase(formData);
            if (result.success) {
                setSuccess(true);
                // Wait a moment to show success message before redirecting
                setTimeout(() => {
                    router.push("/dashboard");
                    router.refresh();
                }, 2000);
            } else {
                throw new Error("Submission failed");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to submit case");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Upload Complete!</h2>
                <p className="mt-2 text-zinc-400">Your case has been submitted successfully.</p>
                <p className="mt-1 text-sm text-zinc-500">Redirecting to dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Report Missing Person</h1>
                <p className="text-zinc-400">
                    Provide details and footage to start the search.
                </p>
            </div>

            <form action={handleSubmit} className="space-y-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-sm">
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-black/80 backdrop-blur-sm">
                        <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-500" />
                        <p className="font-medium text-white">Uploading files...</p>
                        <p className="text-sm text-zinc-400">Please wait, do not close this window.</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">
                            Case Title
                        </label>
                        <input
                            name="title"
                            required
                            placeholder="e.g., Missing Person at Central Station"
                            className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-2.5 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">
                            Missing Person Name
                        </label>
                        <input
                            name="missingPersonName"
                            required
                            placeholder="Full Name"
                            className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-2.5 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows={4}
                            placeholder="Physical description, last seen location, etc."
                            className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-2.5 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">
                            Reference Photo
                        </label>
                        <div className="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors">
                            <ImageIcon className="mb-2 h-6 w-6 text-zinc-500" />
                            <span className="text-xs text-zinc-500">Upload Image</span>
                            <input
                                type="file"
                                name="refImage"
                                accept="image/*"
                                required
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">
                            CCTV Footage
                        </label>
                        <div className="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors">
                            <Video className="mb-2 h-6 w-6 text-zinc-500" />
                            <span className="text-xs text-zinc-500">Upload Video</span>
                            <input
                                type="file"
                                name="video"
                                accept="video/*"
                                required
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Case
                </button>
            </form>
        </div>
    );
}
