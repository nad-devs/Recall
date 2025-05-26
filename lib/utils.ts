import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a related concept object or string into a display string
 * @param concept The concept object or string to format
 * @returns A string representation of the concept
 */
export function formatRelatedConcept(concept: any): string {
  if (typeof concept === 'string') {
    return concept;
  } else if (typeof concept === 'object' && concept !== null) {
    return concept.title || (concept.id ? 'Related concept' : 'Unknown concept');
  }
  return 'Unknown concept';
}

/**
 * Formats an array of related concepts into a display string
 * @param concepts Array of concept objects or strings
 * @param separator The separator to use between concepts (default: ", ")
 * @returns A formatted string of related concepts
 */
export function formatRelatedConcepts(concepts: any[], separator: string = ", "): string {
  if (!Array.isArray(concepts)) return "";
  return concepts.map(formatRelatedConcept).join(separator);
}
