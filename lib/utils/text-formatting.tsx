import React from 'react'

// Helper function to escape regex special characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to format inline text (highlight technical terms more subtly)
export function formatInlineText(text: string): (string | React.ReactElement)[] {
  const result: (string | React.ReactElement)[] = [];
  
  // Expanded technical terms with categories for better highlighting
  const technicalTerms = [
    'API', 'REST', 'GraphQL', 'JSON', 'XML', 'HTTP', 'HTTPS', 'URL', 'URI',
    'database', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite',
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Vue.js', 'Angular',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'GCP',
    'Terraform', 'Infrastructure as Code', 'IaC', 'HCL', 'HashiCorp',
    'HashiCorp Configuration Language', 'state file', 'providers', 'execution plan',
    'multi-cloud', 'on-premises', 'orchestration', 'provisioning', 'dependencies',
    'modular design', 'version control', 'configuration files', 'state management',
    'microservices', 'serverless', 'containers', 'deployment', 'CI/CD',
    'machine learning', 'ML', 'AI', 'artificial intelligence', 'neural network',
    'deep learning', 'algorithm', 'data structure', 'optimization'
  ];

  let remainingText = text;
  let keyCounter = 0;

  // Find and highlight technical terms with subtle styling
  technicalTerms.forEach(term => {
    const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
    const parts = remainingText.split(regex);
    const matches = remainingText.match(regex) || [];

    if (matches.length > 0) {
      const newResult: (string | React.ReactElement)[] = [];
      parts.forEach((part, index) => {
        if (part) newResult.push(part);
        if (index < matches.length) {
          newResult.push(
            <span key={`term-${keyCounter++}`} className="font-medium text-primary">
              {matches[index]}
            </span>
          );
        }
      });
      remainingText = newResult.map(item => typeof item === 'string' ? item : term).join('');
      result.length = 0;
      result.push(...newResult);
    }
  });

  if (result.length === 0) {
    result.push(text);
  }

  return result;
}

// Simplified utility function to format technical text for better readability
export function formatDetailsText(text: string): React.ReactElement[] {
  if (!text) return [];

  const sections: React.ReactElement[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) return;

    // Enhanced heading detection with clean styling
    const isMainHeading = trimmedParagraph.length < 50 && 
                         (trimmedParagraph.endsWith(':') || 
                          /^[A-Z][^.]*$/.test(trimmedParagraph) ||
                          trimmedParagraph.split(' ').length <= 3);

    const isSubHeading = trimmedParagraph.length < 100 && 
                        (trimmedParagraph.endsWith(':') || 
                         trimmedParagraph.split(' ').length <= 6) &&
                        !isMainHeading;

    if (isMainHeading) {
      sections.push(
        <h3 key={`main-heading-${paragraphIndex}`} className="text-lg font-bold text-primary mt-8 mb-4">
          {trimmedParagraph.replace(/:$/, '')}
        </h3>
      );
      return;
    }

    if (isSubHeading) {
      sections.push(
        <h4 key={`sub-heading-${paragraphIndex}`} className="text-base font-semibold text-foreground mt-6 mb-3">
          {trimmedParagraph.replace(/:$/, '')}
        </h4>
      );
      return;
    }

    // Enhanced bullet point detection and formatting
    const bulletPointPatterns = [
      /^[-•*]\s+/,
      /^\d+\.\s+/,
      /^[a-zA-Z]\.\s+/,
      /^[ivx]+\.\s+/i
    ];

    const lines = trimmedParagraph.split('\n').map(line => line.trim()).filter(Boolean);
    
    const linesWithBullets = lines.filter(line => 
      bulletPointPatterns.some(pattern => pattern.test(line))
    );

    if (linesWithBullets.length > 1 && linesWithBullets.length >= lines.length * 0.6) {
      const listItems = lines.map((line, lineIndex) => {
        const cleanedLine = line.replace(/^[-•*]\s+|^\d+\.\s+|^[a-zA-Z]\.\s+|^[ivx]+\.\s+/i, '');
        return (
          <li key={`list-${paragraphIndex}-${lineIndex}`} className="mb-2 leading-relaxed">
            {formatInlineText(cleanedLine)}
          </li>
        );
      });

      sections.push(
        <ul key={`list-${paragraphIndex}`} className="list-disc pl-6 space-y-1 my-4">
          {listItems}
        </ul>
      );
      return;
    }

    // Enhanced key-value pairs and definitions with clean styling
    const definitionPattern = /^([A-Za-z\s]+):\s*(.+)$/;
    if (definitionPattern.test(trimmedParagraph)) {
      const match = trimmedParagraph.match(definitionPattern);
      if (match) {
        sections.push(
          <div key={`definition-${paragraphIndex}`} className="my-4 p-4 bg-muted/30 rounded-lg border-l-2 border-primary">
            <span className="font-semibold text-primary">{match[1]}:</span>
            <span className="ml-2 text-muted-foreground">{formatInlineText(match[2])}</span>
          </div>
        );
        return;
      }
    }

    // Regular paragraph with good spacing
    const sentences = trimmedParagraph.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    sentences.forEach(sentence => {
      if (currentChunk.length + sentence.length > 400 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    });

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    chunks.forEach((chunk, chunkIndex) => {
      sections.push(
        <p key={`paragraph-${paragraphIndex}-${chunkIndex}`} className="mb-6 leading-relaxed text-foreground/90">
          {formatInlineText(chunk)}
        </p>
      );
    });

    // Add subtle separator between major sections
    if (paragraphIndex < paragraphs.length - 1 && paragraphs[paragraphIndex + 1].trim()) {
      sections.push(
        <div key={`separator-${paragraphIndex}`} className="my-6 border-b border-border/50" />
      );
    }
  });

  return sections;
} 