// Simple YouTube transcript detection
export function isYouTubeTranscript(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  
  // Look for timestamp patterns like "27:21", "1:23:45", "0:15", etc.
  const timestampPattern = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g;
  const timestamps = text.match(timestampPattern) || [];
  
  // If we have 3+ timestamps, likely a YouTube transcript
  return timestamps.length >= 3;
} 