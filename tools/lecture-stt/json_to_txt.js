import fs from "node:fs/promises";
import path from "node:path";

/**
 * Usage:
 *   node json_to_txt.js ./out/lecture1.mp3.json
 *
 * Output:
 *   ./out/lecture1.mp3.txt
 */

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("❌ Please provide a JSON transcript file.");
    console.error("Example: node json_to_txt.js ./out/lecture1.mp3.json");
    process.exit(1);
  }

  const raw = await fs.readFile(inputPath, "utf-8");
  const data = JSON.parse(raw);

  let text = "";

  // Most common case
  if (typeof data.text === "string") {
    text = data.text;
  }

  // Fallback: segments
  else if (Array.isArray(data.segments)) {
    text = data.segments
      .map(s => s.text)
      .join("\n");
  }

  // Fallback: words
  else if (Array.isArray(data.words)) {
    text = data.words
      .map(w => w.text || w.word || "")
      .join(" ");
  }

  if (!text.trim()) {
    console.error("❌ No readable text found in JSON.");
    process.exit(1);
  }

  const outPath = inputPath.replace(/\.json$/, ".txt");
  await fs.writeFile(outPath, text, "utf-8");

  console.log("✅ Text file created:");
  console.log(outPath);
}

main().catch(err => {
  console.error("🔥 Error:", err);
});
