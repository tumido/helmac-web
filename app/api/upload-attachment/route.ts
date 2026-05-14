import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { requireEditor } from "@/lib/auth";
import {
    ATTACHMENT_ALLOWED_TYPES,
    MAX_ATTACHMENT_SIZE,
} from "@/lib/validators/email-attachment";

const UPLOAD_DIR = path.join(process.cwd(), "public", "email-attachments");

function generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}${ext}`;
}

function sanitizeFilename(filename: string): string {
    const baseName = path.basename(filename);
    return baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(request: NextRequest) {
    try {
        await requireEditor();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Zadny soubor nebyl nahran" },
                { status: 400 }
            );
        }

        if (!ATTACHMENT_ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    error:
                        "Nepodporovany typ souboru. Povolene typy: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, obrazky",
                },
                { status: 400 }
            );
        }

        if (file.size > MAX_ATTACHMENT_SIZE) {
            return NextResponse.json(
                { error: "Soubor je prilis velky. Maximum je 10 MB" },
                { status: 400 }
            );
        }

        const sanitized = sanitizeFilename(file.name);
        const storedFilename = generateFilename(sanitized);

        let url: string;

        if (process.env.VERCEL) {
            const blob = await put(`email-attachments/${storedFilename}`, file, {
                access: "public",
            });
            url = blob.url;
        } else {
            if (!existsSync(UPLOAD_DIR)) {
                await mkdir(UPLOAD_DIR, { recursive: true });
            }

            const filepath = path.join(UPLOAD_DIR, storedFilename);
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filepath, buffer);

            url = `/email-attachments/${storedFilename}`;
        }

        return NextResponse.json({
            url,
            filename: sanitized,
            contentType: file.type,
            size: file.size,
        });
    } catch (error) {
        console.error("Attachment upload error:", error);
        return NextResponse.json(
            { error: "Nahravani selhalo" },
            { status: 500 }
        );
    }
}
