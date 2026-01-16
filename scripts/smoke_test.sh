#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

say() {
  echo "\n==> $1"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

require_cmd curl
require_cmd node

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

# Create a tiny WAV file (0.1s of silence) for upload tests
TMP_WAV="$(mktemp -t lecture_demo_XXXX).wav"
node - <<'NODE'
const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Missing output path');
  process.exit(1);
}

// 16-bit PCM, mono, 16000 Hz, 0.1s silence
const sampleRate = 16000;
const seconds = 0.1;
const numSamples = Math.floor(sampleRate * seconds);
const bytesPerSample = 2;
const dataSize = numSamples * bytesPerSample;

function writeString(buf, offset, str) {
  buf.write(str, offset, str.length, 'ascii');
}

const header = Buffer.alloc(44);
writeString(header, 0, 'RIFF');
header.writeUInt32LE(36 + dataSize, 4);
writeString(header, 8, 'WAVE');
writeString(header, 12, 'fmt ');
header.writeUInt32LE(16, 16); // PCM
header.writeUInt16LE(1, 20);  // audio format
header.writeUInt16LE(1, 22);  // channels
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * bytesPerSample, 28); // byte rate
header.writeUInt16LE(bytesPerSample, 32); // block align
header.writeUInt16LE(16, 34); // bits per sample
writeString(header, 36, 'data');
header.writeUInt32LE(dataSize, 40);

const data = Buffer.alloc(dataSize); // silence
fs.writeFileSync(path, Buffer.concat([header, data]));
NODE
"$TMP_WAV"

cleanup() {
  rm -f "$TMP_WAV" >/dev/null 2>&1 || true
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

say "Checking server: $BASE_URL/health"
if ! curl -fsS "$BASE_URL/health" >/dev/null 2>&1; then
  say "Server not running — starting (npm run dev)"
  (cd "$ROOT_DIR" && npm run dev) >/dev/null 2>&1 &
  SERVER_PID=$!
  # wait up to ~15s
  for _ in $(seq 1 30); do
    if curl -fsS "$BASE_URL/health" >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
fi

say "Create course"
COURSE_JSON=$(curl -fsS -X POST "$BASE_URL/api/courses" \
  -H 'content-type: application/json' \
  -d '{"code":"CISC121","title":"Intro to Computing"}') || true

# If it already exists, fine — continue
COURSE_EXISTS=$(echo "$COURSE_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{try{const j=JSON.parse(s);console.log(!!j?.code)}catch{console.log(false)}})')
if [[ "$COURSE_EXISTS" != "true" ]]; then
  say "Course likely already exists — continuing"
fi

say "Upload lecture"
UPLOAD_JSON=$(curl -fsS -X POST "$BASE_URL/api/courses/CISC121/lectures" \
  -F lectureNumber=5 \
  -F lectureTitle='Lecture 05' \
  -F file=@"$TMP_WAV")

LECTURE_ID=$(echo "$UPLOAD_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s);console.log(j.id)})')
echo "Lecture ID: $LECTURE_ID"

say "Start processing job"
curl -fsS -X POST "$BASE_URL/api/lectures/$LECTURE_ID/process" \
  -H 'content-type: application/json' \
  -d '{"generateTTS":false}' >/dev/null

say "Poll status until complete (max ~30s)"
for _ in $(seq 1 60); do
  STATUS_JSON=$(curl -fsS "$BASE_URL/api/lectures/$LECTURE_ID/status")
  STATUS=$(echo "$STATUS_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s);console.log(j.status)})')
  echo "Status: $STATUS"
  if [[ "$STATUS" == "complete" || "$STATUS" == "failed" ]]; then
    break
  fi
  sleep 0.5
done

say "Fetch outputs"
curl -fsS "$BASE_URL/api/lectures/$LECTURE_ID/transcript" >/dev/null
curl -fsS "$BASE_URL/api/lectures/$LECTURE_ID/notes?type=short" >/dev/null

say "Fetch public notes"
curl -fsS "$BASE_URL/api/public/CISC121/lecture/5/notes?type=short" >/dev/null

say "SMOKE TEST PASSED"
