import fs from 'fs/promises';
import path from 'path';
import { storagePaths } from '../config';
import { sanitizeCourseCode, safePath, sanitizeFilename } from '../utils/sanitize';

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore if already exists
  }
}

/**
 * Save uploaded audio file
 */
export async function saveAudioFile(
  courseCode: string,
  lectureId: number,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const safeCode = sanitizeCourseCode(courseCode);
  const safeFilename = sanitizeFilename(filename);
  const audioDir = safePath(storagePaths.audio, safeCode);
  
  await ensureDir(audioDir);
  
  const filePath = path.join(audioDir, `${lectureId}_${safeFilename}`);
  await fs.writeFile(filePath, buffer);
  
  return filePath;
}

/**
 * Get output directory for a lecture
 */
export function getOutputDir(courseCode: string, lectureId: number): string {
  const safeCode = sanitizeCourseCode(courseCode);
  return safePath(storagePaths.outputs, safeCode, lectureId.toString());
}

/**
 * Save text file (transcript, notes, etc.)
 */
export async function saveTextFile(
  courseCode: string,
  lectureId: number,
  filename: string,
  content: string
): Promise<string> {
  const outputDir = getOutputDir(courseCode, lectureId);
  await ensureDir(outputDir);
  
  const filePath = path.join(outputDir, filename);
  await fs.writeFile(filePath, content, 'utf-8');
  
  return filePath;
}

/**
 * Save JSON file
 */
export async function saveJsonFile(
  courseCode: string,
  lectureId: number,
  filename: string,
  data: any
): Promise<string> {
  const outputDir = getOutputDir(courseCode, lectureId);
  await ensureDir(outputDir);
  
  const filePath = path.join(outputDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  
  return filePath;
}

/**
 * Save binary file (e.g., MP3)
 */
export async function saveBinaryFile(
  courseCode: string,
  lectureId: number,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const outputDir = getOutputDir(courseCode, lectureId);
  await ensureDir(outputDir);
  
  const filePath = path.join(outputDir, filename);
  await fs.writeFile(filePath, buffer);
  
  return filePath;
}

/**
 * Read text file
 */
export async function readTextFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Read JSON file
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stream for reading
 */
export async function getFileStream(filePath: string): Promise<fs.FileHandle> {
  return await fs.open(filePath, 'r');
}

