import { NextResponse } from "next/server"; 
import fs from "fs";
import path from "path";
import { config, storagePaths } from "@/config";
import prisma from "@/db";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!config.allowedMimeTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type" },
      { status: 400 }
    );
  }

  await fs.promises.mkdir(storagePaths.audio, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(storagePaths.audio, filename);

  await fs.promises.writeFile(filepath, buffer);

  await prisma.upload.create({
  data: {
    filename: file.name,
    filepath: filepath,
    mimetype: file.type,
    size: file.size,
  },
});

  return NextResponse.json({
    ok: true,
    filename,
  });
}



