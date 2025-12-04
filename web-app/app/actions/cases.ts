"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { join } from "path";

export async function submitCase(formData: FormData) {
    const session = await getServerSession();
    if (!session?.user?.email) {
        throw new Error("Unauthorized");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const missingPersonName = formData.get("missingPersonName") as string;
    const refImage = formData.get("refImage") as File;
    const video = formData.get("video") as File;

    if (!title || !missingPersonName || !refImage || !video) {
        throw new Error("Missing required fields");
    }

    // Get user
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error("User not found");

    // Save files
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(join(uploadDir, "images"), { recursive: true });
    await mkdir(join(uploadDir, "videos"), { recursive: true });

    // Save Image
    const imageBuffer = Buffer.from(await refImage.arrayBuffer());
    const imageFileName = `${Date.now()}_${refImage.name.replace(/\s/g, "_")}`;
    const imagePath = join(uploadDir, "images", imageFileName);
    await writeFile(imagePath, imageBuffer);

    // Store web-accessible path in DB
    const webImagePath = `/uploads/images/${imageFileName}`;

    // Save Video
    const videoBuffer = Buffer.from(await video.arrayBuffer());
    const videoFileName = `${Date.now()}_${video.name.replace(/\s/g, "_")}`;
    const videoPath = join(uploadDir, "videos", videoFileName);
    await writeFile(videoPath, videoBuffer);
    const webVideoPath = `/uploads/videos/${videoFileName}`;

    // Create Case in DB
    await prisma.case.create({
        data: {
            title,
            description,
            missingPersonName,
            refImage: webImagePath,
            video: webVideoPath,
            userId: user.id,
            status: "PENDING",
        },
    });

    revalidatePath("/dashboard");
    return { success: true };
}
