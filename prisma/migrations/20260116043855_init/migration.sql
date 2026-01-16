-- CreateTable
CREATE TABLE "courses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "lectures" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "lectureNumber" INTEGER NOT NULL,
    "lectureTitle" TEXT,
    "recordedAt" DATETIME,
    "audioFilename" TEXT NOT NULL,
    "audioMime" TEXT NOT NULL,
    "audioPath" TEXT NOT NULL,
    "durationSeconds" REAL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "transcriptJsonPath" TEXT,
    "transcriptTextPath" TEXT,
    "notesShortMdPath" TEXT,
    "notesDetailedMdPath" TEXT,
    "flashcardsJsonPath" TEXT,
    "quizJsonPath" TEXT,
    "podcastScriptPath" TEXT,
    "podcastAudioMp3Path" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lectures_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lectures_courseId_lectureNumber_key" ON "lectures"("courseId", "lectureNumber");
