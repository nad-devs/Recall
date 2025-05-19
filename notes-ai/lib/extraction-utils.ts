// Utility functions for extracting information from conversation text

// Helper function to extract a meaningful title from conversation text
export function extractMeaningfulTitle(text: string): string {
  if (!text) return '';
  
  // Look for patterns that might indicate a topic name
  // 1. Check for "problem", "called", or similar pattern
  const problemMatch = text.match(/called\s+([A-Za-z0-9\s]+)(?:,|\.|problem)/i);
  if (problemMatch && problemMatch[1]) {
    return problemMatch[1].trim();
  }
  
  // 2. Check for "I'm doing X" or "working on X" patterns
  const topicMatch = text.match(/(?:doing|working on|learning about|studying|implementing|exploring)\s+([A-Z][A-Za-z0-9\s]+?)(?:\.|\n|$)/);
  if (topicMatch && topicMatch[1]) {
    return topicMatch[1].trim();
  }
  
  // 3. Look for capitalized phrases that might be topic names
  const capitalizedMatch = text.match(/([A-Z][A-Za-z0-9\s]{2,30}?)(?:problem|algorithm|technique)/i);
  if (capitalizedMatch && capitalizedMatch[1]) {
    return capitalizedMatch[1].trim() + ' Problem';
  }
  
  // 4. Extract first sentence if it's short and specific
  const firstSentence = text.split(/[.!?]/)[0].trim();
  if (firstSentence.length < 50 && firstSentence.length > 10) {
    return firstSentence;
  }
  
  return '';
}

// Extract a more focused summary
export function extractFocusedSummary(text: string): string {
  if (!text) return '';
  
  // Look for a clear description or statement about the problem/topic
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  
  // Try to find a sentence that describes what the topic is about
  for (const sentence of sentences) {
    if (sentence.includes('involves') || 
        sentence.includes('is about') || 
        sentence.includes('refers to') ||
        sentence.includes('problem is')) {
      return sentence.trim();
    }
  }
  
  // If no clear description found, use the first 1-2 sentences
  if (sentences.length > 0) {
    return sentences.slice(0, 2).join('. ').trim();
  }
  
  return text.substring(0, 150) + (text.length > 150 ? '...' : '');
}

// Extract key topics from conversation
export function extractKeyTopics(text: string): string[] {
  const topics = [];
  
  // Look for technical terms, languages, algorithms
  const techTerms = text.match(/(?:JavaScript|TypeScript|Python|React|Node|Algorithm|Data Structure|API|Component|Function|Class|Object|Array|Hash|Map|Set)(?:\s+[A-Za-z]+)?/gi);
  
  if (techTerms) {
    // Deduplicate and take top 3
    const uniqueTerms = [...new Set(techTerms.map(t => t.trim()))];
    topics.push(...uniqueTerms.slice(0, 3));
  }
  
  return topics;
}

// Extract key takeaways from conversation text
export function extractKeyTakeaways(text: string): string[] {
  const takeaways = [];
  
  // Look for "key points", "important to note", etc.
  const keyPointMatches = text.match(/(?:key point|important|note that|remember|takeaway|tip)(?:s)?(?:\s+is|\:)\s+(.{10,100}?)(?:\.|\n|$)/gi);
  
  if (keyPointMatches) {
    keyPointMatches.forEach(match => {
      const pointMatch = match.match(/(?:key point|important|note that|remember|takeaway|tip)(?:s)?(?:\s+is|\:)\s+(.{10,100}?)(?:\.|\n|$)/i);
      if (pointMatch && pointMatch[1]) {
        takeaways.push(pointMatch[1].trim());
      }
    });
  }
  
  // If no explicit takeaways, try to extract short, standalone statements that might be important
  if (takeaways.length === 0) {
    const sentences = text.split(/[.!?]/).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 10 && trimmed.length < 100 && 
             (trimmed.includes('should') || trimmed.includes('must') || trimmed.includes('can') || 
              trimmed.includes('important') || trimmed.includes('useful'));
    });
    
    takeaways.push(...sentences.slice(0, 3));
  }
  
  return takeaways.slice(0, 3); // Return at most 3 takeaways
} 