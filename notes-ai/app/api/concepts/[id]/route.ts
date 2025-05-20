import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Fix for Next.js 15: await params before accessing properties
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Fetch the concept with its code snippets
    const concept = await prisma.concept.findUnique({
      where: { id },
      include: {
        codeSnippets: true,
        conversation: true,
      },
    });

    if (!concept) {
      return NextResponse.json(
        { error: 'Concept not found' },
        { status: 404 }
      );
    }

    // Extract meaningful title from concept or conversation
    const meaningfulTitle = concept.title || extractMeaningfulTitle(concept.conversation?.text || '');
    if (!concept.title && meaningfulTitle && meaningfulTitle !== concept.title) {
      await prisma.concept.update({
        where: { id: concept.id },
        data: { title: meaningfulTitle }
      });
      concept.title = meaningfulTitle;
    }

    // Parse and filter fields
    let keyPoints: string[] = [];
    try {
      keyPoints = concept.keyPoints ? JSON.parse(concept.keyPoints) : [];
      if (!Array.isArray(keyPoints)) keyPoints = [concept.keyPoints];
    } catch {
      if (concept.keyPoints) keyPoints = [concept.keyPoints];
    }
    keyPoints = keyPoints.filter((k) => k && k.trim().length > 0);

    let details = '';
    try {
      if (concept.details) {
        const parsed = JSON.parse(concept.details);
        if (typeof parsed === 'string') {
          details = parsed;
        } else if (typeof parsed === 'object') {
          // Only keep non-empty string fields (e.g., implementation, performance)
          details = Object.values(parsed)
            .filter((v) => typeof v === 'string' && v.trim().length > 0)
            .join('\n\n');
        }
      }
    } catch {
      if (concept.details && typeof concept.details === 'string') details = concept.details;
    }
    details = details.trim();

    // Parse related concepts - handle new format with both IDs and titles
    let relatedConceptData: Array<{id?: string, title?: string}> = [];
    try {
      const parsedRelatedConcepts = concept.relatedConcepts ? JSON.parse(concept.relatedConcepts) : [];
      
      if (Array.isArray(parsedRelatedConcepts)) {
        // Handle both simple string array and object array formats
        const tempArr: Array<{id?: string, title?: string}> = [];
        parsedRelatedConcepts.forEach(item => {
          if (typeof item === 'string') {
            tempArr.push({ title: item });
          } else if (typeof item === 'object' && item !== null) {
            // Ensure we have either an ID or title
            if (item.id && typeof item.id === 'string') {
              // Include the title if we have it
              if (item.title && typeof item.title === 'string') {
                tempArr.push({ id: item.id, title: item.title });
              } else {
                tempArr.push({ id: item.id });
              }
            } else if (item.title && typeof item.title === 'string') {
              tempArr.push({ title: item.title });
            }
          }
        });
        relatedConceptData = tempArr;
      } else if (typeof parsedRelatedConcepts === 'string') {
        relatedConceptData = [{ title: parsedRelatedConcepts }];
      }
    } catch {
      if (concept.relatedConcepts && typeof concept.relatedConcepts === 'string') {
        // If it's a comma-separated list
        relatedConceptData = concept.relatedConcepts.split(',')
          .map(c => ({ title: c.trim() }))
          .filter(item => item.title.length > 0);
      }
    }

    // Filter out any invalid entries
    relatedConceptData = relatedConceptData.filter(item => 
      (item.id && typeof item.id === 'string') || 
      (item.title && typeof item.title === 'string')
    );

    const codeSnippets = (concept.codeSnippets || []).filter(
      (s) => s.code && s.code.trim().length > 0
    ).map((s) => ({
      language: s.language,
      code: s.code,
      description: s.description
    }));

    // Build the cleaned concept object
    const cleanedConcept: any = {
      id: concept.id,
      title: concept.title,
      category: concept.category || guessCategoryFromTitle(concept.title),
      summary: concept.summary,
    };
    if (keyPoints.length > 0) cleanedConcept.keyPoints = keyPoints;
    if (details.length > 0) cleanedConcept.details = details;
    if (codeSnippets.length > 0) cleanedConcept.codeSnippets = codeSnippets;
    if (relatedConceptData.length > 0) cleanedConcept.relatedConcepts = relatedConceptData;

    // Get conversations where this concept appears using occurrences
    const occurrences = await prisma.occurrence.findMany({
      where: {
        conceptId: concept.id
      },
      include: {
        conversation: true
      }
    });

    const relatedConversations = occurrences
      .map(occurrence => occurrence.conversation)
      .filter(Boolean)
      .map(conv => {
        const title = conv.summary || extractMeaningfulTitle(conv.text) || `Conversation ${conv.id.substring(0, 8)}`;
        const summary = extractFocusedSummary(conv.text);
        return {
          id: conv.id,
          title: title,
          date: conv.createdAt,
          summary: summary
        };
      });

    // Fetch related concepts using both IDs and titles
    const relatedConcepts = [];
    
    // Split related concepts data into ID-based and title-based lookups
    const relatedConceptIds = relatedConceptData
      .filter(item => item.id)
      .map(item => item.id)
      .filter((id): id is string => typeof id === 'string');
      
    const relatedConceptTitles = relatedConceptData
      .filter(item => item.title && !item.id)
      .map(item => item.title)
      .filter((title): title is string => typeof title === 'string');

    // Fetch by IDs if available
    if (relatedConceptIds.length > 0) {
      const conceptsById = await prisma.concept.findMany({
        where: {
          id: {
            in: relatedConceptIds
          }
        },
        include: {
          codeSnippets: true
        }
      });
      
      relatedConcepts.push(...conceptsById);
    }
    
    // Fetch by titles if available
    if (relatedConceptTitles.length > 0) {
      const conceptsByTitle = await prisma.concept.findMany({
        where: {
          title: {
            in: relatedConceptTitles
          },
          id: {
            not: concept.id // Don't include the current concept
          }
        },
        include: {
          codeSnippets: true
        }
      });
      
      // Add only those that aren't already included by ID
      for (const rc of conceptsByTitle) {
        if (!relatedConcepts.some(existing => existing.id === rc.id)) {
          relatedConcepts.push(rc);
        }
      }
    }
    
    // Format the related concepts for consistent output
    const formattedRelatedConcepts = relatedConcepts.map(rc => ({
      id: rc.id,
      title: rc.title,
      category: rc.category || guessCategoryFromTitle(rc.title),
      summary: rc.summary,
      codeSnippets: rc.codeSnippets ? rc.codeSnippets.length : 0
    }));

    return NextResponse.json({
      concept: cleanedConcept,
      relatedConversations: relatedConversations,
      relatedConcepts: formattedRelatedConcepts.length > 0 ? formattedRelatedConcepts : undefined
    });
  } catch (error) {
    console.error('Error fetching concept:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concept' },
      { status: 500 }
    );
  }
}

// Add PUT method to update concept properties
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Resolve params
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Get the request body
    const data = await request.json();
    
    // Check if the concept exists
    const existingConcept = await prisma.concept.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        relatedConcepts: true
      }
    });

    if (!existingConcept) {
      return NextResponse.json(
        { error: 'Concept not found' },
        { status: 404 }
      );
    }
    
    // Handle related concepts bidirectional relationships
    if (data.relatedConcepts) {
      let newRelatedConcepts;
      
      // Parse the new related concepts
      try {
        if (typeof data.relatedConcepts === 'string') {
          newRelatedConcepts = JSON.parse(data.relatedConcepts);
        } else {
          newRelatedConcepts = data.relatedConcepts;
        }
        
        // Ensure it's an array
        if (!Array.isArray(newRelatedConcepts)) {
          if (typeof newRelatedConcepts === 'string') {
            newRelatedConcepts = [newRelatedConcepts];
          } else if (typeof newRelatedConcepts === 'object') {
            newRelatedConcepts = [newRelatedConcepts];
          } else {
            newRelatedConcepts = [];
          }
        }
        
        // Get the existing related concepts
        let existingRelatedConcepts = [];
        try {
          existingRelatedConcepts = JSON.parse(existingConcept.relatedConcepts || '[]');
          if (!Array.isArray(existingRelatedConcepts)) {
            existingRelatedConcepts = [];
          }
        } catch {
          existingRelatedConcepts = [];
        }
        
        // Find concepts that are being removed
        const removedRelatedConcepts = existingRelatedConcepts.filter(existing => {
          // Check if the existing concept is not in the new list
          return !newRelatedConcepts.some(newItem => {
            if (typeof existing === 'string' && typeof newItem === 'string') {
              return existing === newItem;
            } else if (typeof existing === 'object' && typeof newItem === 'object') {
              return existing.id === newItem.id;
            } else if (typeof existing === 'string' && typeof newItem === 'object') {
              return existing === newItem.title;
            } else if (typeof existing === 'object' && typeof newItem === 'string') {
              return existing.title === newItem;
            }
            return false;
          });
        });
        
        // Find concepts that are being added
        const addedRelatedConcepts = newRelatedConcepts.filter(newItem => {
          // Check if the new concept is not in the existing list
          return !existingRelatedConcepts.some(existing => {
            if (typeof existing === 'string' && typeof newItem === 'string') {
              return existing === newItem;
            } else if (typeof existing === 'object' && typeof newItem === 'object') {
              return existing.id === newItem.id;
            } else if (typeof existing === 'string' && typeof newItem === 'object') {
              return existing === newItem.title;
            } else if (typeof existing === 'object' && typeof newItem === 'string') {
              return existing.title === newItem;
            }
            return false;
          });
        });
        
        // Process removals - remove reverse relationships
        for (const removed of removedRelatedConcepts) {
          let removedId;
          let removedTitle;
          
          if (typeof removed === 'string') {
            removedTitle = removed;
            // Find the concept by title
            const relatedConcept = await prisma.concept.findFirst({
              where: { title: removed },
              select: { id: true, relatedConcepts: true }
            });
            if (relatedConcept) {
              removedId = relatedConcept.id;
              
              // Remove the reverse relationship
              try {
                let reverseRelated = JSON.parse(relatedConcept.relatedConcepts || '[]');
                if (!Array.isArray(reverseRelated)) {
                  reverseRelated = [];
                }
                
                // Filter out the relationship
                reverseRelated = reverseRelated.filter(rel => {
                  if (typeof rel === 'string') {
                    return rel !== existingConcept.title;
                  } else if (typeof rel === 'object') {
                    return rel.id !== existingConcept.id;
                  }
                  return true;
                });
                
                // Update the related concept
                await prisma.concept.update({
                  where: { id: removedId },
                  data: { relatedConcepts: JSON.stringify(reverseRelated) }
                });
              } catch (error) {
                console.error("Error updating reverse relationship:", error);
              }
            }
          } else if (typeof removed === 'object' && removed.id) {
            removedId = removed.id;
            
            // Get the related concept
            const relatedConcept = await prisma.concept.findUnique({
              where: { id: removedId },
              select: { relatedConcepts: true }
            });
            
            if (relatedConcept) {
              // Remove the reverse relationship
              try {
                let reverseRelated = JSON.parse(relatedConcept.relatedConcepts || '[]');
                if (!Array.isArray(reverseRelated)) {
                  reverseRelated = [];
                }
                
                // Filter out the relationship
                reverseRelated = reverseRelated.filter(rel => {
                  if (typeof rel === 'string') {
                    return rel !== existingConcept.title;
                  } else if (typeof rel === 'object') {
                    return rel.id !== existingConcept.id;
                  }
                  return true;
                });
                
                // Update the related concept
                await prisma.concept.update({
                  where: { id: removedId },
                  data: { relatedConcepts: JSON.stringify(reverseRelated) }
                });
              } catch (error) {
                console.error("Error updating reverse relationship:", error);
              }
            }
          }
        }
        
        // Process additions - create reverse relationships
        for (const added of addedRelatedConcepts) {
          let addedId;
          let addedTitle;
          
          if (typeof added === 'string') {
            addedTitle = added;
            // Find the concept by title
            const relatedConcept = await prisma.concept.findFirst({
              where: { title: added },
              select: { id: true, title: true, relatedConcepts: true }
            });
            
            if (relatedConcept) {
              addedId = relatedConcept.id;
              
              // Add the reverse relationship
              try {
                let reverseRelated = [];
                try {
                  reverseRelated = JSON.parse(relatedConcept.relatedConcepts || '[]');
                  if (!Array.isArray(reverseRelated)) {
                    reverseRelated = [];
                  }
                } catch {
                  reverseRelated = [];
                }
                
                // Check if reverse relationship already exists
                const reverseExists = reverseRelated.some(rel => {
                  if (typeof rel === 'string') {
                    return rel === existingConcept.title;
                  } else if (typeof rel === 'object') {
                    return rel.id === existingConcept.id;
                  }
                  return false;
                });
                
                if (!reverseExists) {
                  // Add current concept to related concept's relationships
                  reverseRelated.push({ id: existingConcept.id, title: existingConcept.title });
                  
                  // Update the related concept
                  await prisma.concept.update({
                    where: { id: addedId },
                    data: { relatedConcepts: JSON.stringify(reverseRelated) }
                  });
                }
              } catch (error) {
                console.error("Error updating reverse relationship:", error);
              }
            }
          } else if (typeof added === 'object' && added.id) {
            addedId = added.id;
            
            // Get the related concept
            const relatedConcept = await prisma.concept.findUnique({
              where: { id: addedId },
              select: { id: true, title: true, relatedConcepts: true }
            });
            
            if (relatedConcept) {
              // Add the reverse relationship
              try {
                let reverseRelated = [];
                try {
                  reverseRelated = JSON.parse(relatedConcept.relatedConcepts || '[]');
                  if (!Array.isArray(reverseRelated)) {
                    reverseRelated = [];
                  }
                } catch {
                  reverseRelated = [];
                }
                
                // Check if reverse relationship already exists
                const reverseExists = reverseRelated.some(rel => {
                  if (typeof rel === 'string') {
                    return rel === existingConcept.title;
                  } else if (typeof rel === 'object') {
                    return rel.id === existingConcept.id;
                  }
                  return false;
                });
                
                if (!reverseExists) {
                  // Add current concept to related concept's relationships
                  reverseRelated.push({ id: existingConcept.id, title: existingConcept.title });
                  
                  // Update the related concept
                  await prisma.concept.update({
                    where: { id: addedId },
                    data: { relatedConcepts: JSON.stringify(reverseRelated) }
                  });
                }
              } catch (error) {
                console.error("Error updating reverse relationship:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing related concepts:", error);
      }
    }

    // Update the concept
    const updatedConcept = await prisma.concept.update({
      where: { id },
      data: {
        // Only allow specific fields to be updated
        ...(data.category && { category: data.category }),
        ...(data.title && { title: data.title }),
        ...(data.summary && { summary: data.summary }),
        // Only update other fields if they are provided in the correct format
        ...(data.keyPoints && { keyPoints: typeof data.keyPoints === 'string' 
          ? data.keyPoints 
          : JSON.stringify(data.keyPoints) }),
        ...(data.relatedConcepts && { relatedConcepts: typeof data.relatedConcepts === 'string'
          ? data.relatedConcepts
          : JSON.stringify(data.relatedConcepts) }),
      },
    });

    return NextResponse.json({
      success: true,
      concept: {
        id: updatedConcept.id,
        title: updatedConcept.title,
        category: updatedConcept.category,
        summary: updatedConcept.summary,
      },
    });
  } catch (error) {
    console.error('Error updating concept:', error);
    return NextResponse.json(
      { error: 'Failed to update concept' },
      { status: 500 }
    );
  }
}

// Add DELETE method to remove a concept
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Resolve params
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Check if the concept exists
    const existingConcept = await prisma.concept.findUnique({
      where: { id },
    });

    if (!existingConcept) {
      return NextResponse.json(
        { error: 'Concept not found' },
        { status: 404 }
      );
    }

    // Delete related occurrences first to avoid foreign key constraints
    await prisma.occurrence.deleteMany({
      where: { conceptId: id },
    });
    
    // Delete code snippets
    await prisma.codeSnippet.deleteMany({
      where: { conceptId: id },
    });

    // Delete the concept
    await prisma.concept.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting concept:', error);
    return NextResponse.json(
      { error: 'Failed to delete concept' },
      { status: 500 }
    );
  }
}

// Helper function to extract a meaningful title from conversation text
function extractMeaningfulTitle(text: string): string {
  // Look for patterns that might indicate a topic name
  // 1. Check for "I'm doing X" or "working on X" patterns
  const topicMatch = text.match(/(?:doing|working on|learning about|studying|implementing|exploring)\s+([A-Z][A-Za-z0-9\s]+?)(?:\.|\n|$)/);
  if (topicMatch && topicMatch[1]) {
    return topicMatch[1].trim();
  }
  
  // 2. Look for capitalized phrases that might be topic names
  const capitalizedPhraseMatch = text.match(/([A-Z][A-Za-z0-9\s]{2,30}?)(?:problem|concept|algorithm|pattern|technique)/);
  if (capitalizedPhraseMatch && capitalizedPhraseMatch[1]) {
    return capitalizedPhraseMatch[1].trim();
  }
  
  // 3. Extract first sentence if it's short and specific
  const firstSentence = text.split(/[.!?]/)[0].trim();
  if (firstSentence.length < 50 && firstSentence.length > 10) {
    return firstSentence;
  }
  
  return '';
}

// Extract a more focused, useful summary
function extractFocusedSummary(text: string): string {
  // Look for problem statements or clear descriptions
  const problemMatch = text.match(/(?:problem is|question is|task is|challenge is|trying to|need to)\s+(.{30,200}?)(?:\.|\n|$)/i);
  
  if (problemMatch && problemMatch[1]) {
    return problemMatch[1].trim() + (problemMatch[1].length >= 200 ? '...' : '');
  }
  
  // Default to first 1-2 sentences but make it more intelligent
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0).slice(0, 2);
  if (sentences.length > 0) {
    const combinedSentences = sentences.join('. ');
    return combinedSentences.substring(0, 200) + (combinedSentences.length > 200 ? '...' : '');
  }
  
  return text.substring(0, 200) + (text.length > 200 ? '...' : '');
}

// Guess a category based on the concept title
function guessCategoryFromTitle(title: string): string {
  // Common programming categories
  const categories = {
    "JavaScript": ["javascript", "js", "es6", "ecmascript"],
    "TypeScript": ["typescript", "ts", "types"],
    "React": ["react", "jsx", "component", "hook", "props", "state"],
    "Next.js": ["next", "nextjs", "app router", "pages router"],
    "CSS": ["css", "style", "tailwind", "flex", "grid", "responsive"],
    "Node.js": ["node", "nodejs", "npm", "express"],
    "Database": ["database", "db", "sql", "nosql", "mongo", "postgres", "prisma"],
    "UI/UX": ["ui", "ux", "design", "component", "interface"],
    "Algorithm": ["algorithm", "data structure", "complexity", "big o", "sorting", "search"],
    "Backend Engineering": ["backend", "api", "server", "rest", "graphql"]
  };
  
  const lowerTitle = title.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category;
    }
  }
  
  // Check for specific algorithm keywords
  if (/sort|search|tree|graph|hash|duplicate|binary|linked list/i.test(lowerTitle)) {
    return "Algorithm";
  }
  
  return "General";
}

// Extract key topics from conversation
function extractKeyTopics(text: string): string[] {
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

// Calculate concept importance based on various signals
function calculateConceptImportance(concept: any, relatedConversations: any[]): number {
  // More related conversations suggests higher importance
  const conversationScore = Math.min(relatedConversations.length * 2, 10);
  
  // Code snippets suggest practical application
  const codeScore = concept.codeSnippets?.length ? Math.min(concept.codeSnippets.length * 3, 15) : 0;
  
  // Calculate total (max 25)
  return Math.min(conversationScore + codeScore, 25);
}

// Extract key takeaways from conversation text
function extractKeyTakeaways(text: string): string[] {
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