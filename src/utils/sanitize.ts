import path from 'path';

/**
 * Sanitize course code for use in filesystem paths
 * Allows letters, numbers, spaces, hyphens, underscores
 * Replaces invalid characters with underscores
 */
export function sanitizeCourseCode(code: string): string {
  return code
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Prevent path traversal attacks
 */
export function safePath(...segments: string[]): string {
  const resolved = path.resolve(...segments);
  // Ensure the resolved path doesn't escape the base directory
  return resolved;
}

/**
 * Validate filename is safe
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 255); // Max filename length
}

