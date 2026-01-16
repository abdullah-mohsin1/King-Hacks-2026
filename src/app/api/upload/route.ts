import { FastifyPluginAsync } from "fastify";
import fs from "fs";
import path from "path";
import { config, storagePaths } from "../../../config";
import prisma from "../../../db";

const uploadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post("/", async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: "No file uploaded" });
    }

    if (!config.allowedMimeTypes.includes(data.mimetype)) {
      return reply.status(400).send({ error: "Invalid file type" });
    }

    await fs.promises.mkdir(storagePaths.audio, { recursive: true });

    const filename = `${Date.now()}-${data.filename}`;
    const filepath = path.join(storagePaths.audio, filename);

    const buffer = await data.toBuffer();
    await fs.promises.writeFile(filepath, buffer);

    await prisma.upload.create({
      data: {
        filename: data.filename,
        filepath: filepath,
        mimetype: data.mimetype,
        size: buffer.length,
      },
    });

    return reply.send({
      ok: true,
      filename,
    });
  });
};

export default uploadRoute;



