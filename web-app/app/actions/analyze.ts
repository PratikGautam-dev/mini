"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";

export async function analyzeCase(caseId: string) {
    try {
        const c = await prisma.case.findUnique({
            where: { id: caseId },
            include: { user: true },
        });

        if (!c) throw new Error("Case not found");

        // Resolve absolute paths for AI service
        // DB stores "/uploads/images/..." (web path)
        // We need "C:\...\public\uploads\images\..."
        const absoluteImagePath = path.join(process.cwd(), "public", c.refImage);
        const absoluteVideoPath = path.join(process.cwd(), "public", c.video);

        // Verify files exist
        if (!fs.existsSync(absoluteImagePath)) throw new Error(`Image not found: ${absoluteImagePath}`);
        if (!fs.existsSync(absoluteVideoPath)) throw new Error(`Video not found: ${absoluteVideoPath}`);

        // Prepare FormData for Python API
        const formData = new FormData();

        // We need to read the files to send them? 
        // Wait, the Python service accepts file uploads via multipart/form-data.
        // So we need to stream the files to the Python service.

        const imageBlob = new Blob([fs.readFileSync(absoluteImagePath)], { type: 'image/jpeg' });
        const videoBlob = new Blob([fs.readFileSync(absoluteVideoPath)], { type: 'video/mp4' });

        formData.append("reference_image", imageBlob, "ref.jpg");
        formData.append("video", videoBlob, "video.mp4");
        formData.append("threshold", "0.60"); // Slightly lower threshold
        formData.append("top_n", "5");

        // Call Python Service
        const response = await fetch("http://localhost:8000/analyze", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Service Error: ${errorText}`);
        }

        const result = await response.json();

        // Save Result
        await prisma.analysisResult.create({
            data: {
                caseId: c.id,
                rawResult: JSON.stringify(result),
                topMatch: result.matches && result.matches.length > 0 ? result.matches[0].confidence : 0,
            },
        });

        // Update Case Status
        await prisma.case.update({
            where: { id: caseId },
            data: { status: result.matches && result.matches.length > 0 ? "SOLVED" : "ANALYZING" },
        });

        // Send Email Notification
        if (c.user && c.user.email) {
            try {
                const { sendAnalysisCompletionEmail } = await import("@/lib/mail");
                await sendAnalysisCompletionEmail(c.user.email, c.title, c.id, result);
            } catch (emailError) {
                console.error("Failed to send email notification:", emailError);
                // Don't fail the request if email fails
            }
        }

        revalidatePath(`/admin/cases/${caseId}`);
        return { success: true };

    } catch (error: any) {
        console.error("Analysis failed:", error);
        return { success: false, error: error.message };
    }
}
