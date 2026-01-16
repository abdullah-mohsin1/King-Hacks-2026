import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

async function main() {
  console.log("🚀 Script started");

  // 1. Check API key
  const apiKey = process.env.ELEVENLABS_API_KEY;
  console.log("🔑 API Key exists:", !!apiKey);

  if (!apiKey) {
    console.error("❌ ELEVENLABS_API_KEY is missing");
    process.exit(1);
  }

  // 2. Check input file
  const inputPath = process.argv[2];
  console.log("📂 Input path:", inputPath);

  if (!inputPath) {
    console.error("❌ No audio file path provided");
    process.exit(1);
  }

  const absPath = path.resolve(inputPath);
  console.log("📄 Absolute path:", absPath);

  // 3. Read file
  let audioBuffer;
  try {
    audioBuffer = await fs.readFile(absPath);
    console.log("✅ Audio file read, size:", audioBuffer.length, "bytes");
  } catch (err) {
    console.error("❌ Failed to read audio file:", err.message);
    process.exit(1);
  }

  // 4. Create File object
  const fileName = path.basename(absPath);
  const audioFile = new File([audioBuffer], fileName, {
    type: "audio/mpeg",
  });

  console.log("📦 File object created:", fileName);

  // 5. Init ElevenLabs client
  const client = new ElevenLabsClient({ apiKey });
  console.log("🤖 ElevenLabs client initialized");

  // 6. CALL SPEECH-TO-TEXT
  console.log("🧠 Sending audio to ElevenLabs STT... (this may take ~10–30s)");

  const result = await client.speechToText.convert({
    file: audioFile,
    modelId: "scribe_v2",
  });

  console.log("🎉 Transcription received!");

  // 7. Save output
  await fs.mkdir("./out", { recursive: true });

  const jsonPath = `./out/${fileName}.json`;
  await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));

  console.log("💾 Saved transcript to:", jsonPath);
}

main().catch((err) => {
  console.error("🔥 UNCAUGHT ERROR:", err);
});
