import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { NextRequest } from 'next/server';

// Add these type definitions at the top of the file, after the imports
type RelatedConcept = {
  id?: string;
  title?: string;
};

type RelatedConceptData = string | RelatedConcept;

// Function to remove placeholder concepts from a category
async function removePlaceholderConcepts(category: string): Promise<void> {
  try {
    const placeholderConcepts = await prisma.concept.findMany({
      where: {
        category: category,
        isPlaceholder: true
      }
    });

    if (placeholderConcepts.length > 0) {
      // Delete all placeholder concepts in this category
      await prisma.concept.deleteMany({
        where: {
          category: category,
          isPlaceholder: true
        }
      });
      
      console.log(`Removed ${placeholderConcepts.length} placeholder concept(s) from category: ${category}`);
    }
  } catch (error) {
    console.error('Error removing placeholder concepts:', error);
  }
}

// Utility function to clean up broken related concept references
async function cleanupBrokenRelatedConcepts(userId: string): Promise<void> {
  try {
    // Get all concepts for this user
    const allConcepts = await prisma.concept.findMany({
      where: { userId },
      select: { id: true, title: true, relatedConcepts: true }
    });

    // Create a map of valid concept IDs and titles
    const validConceptIds = new Set(allConcepts.map(c => c.id));
    const validConceptTitles = new Set(allConcepts.map(c => c.title.toLowerCase().trim()));
    const titleToIdMap = new Map();
    allConcepts.forEach(c => titleToIdMap.set(c.title.toLowerCase().trim(), c.id));

    // Process each concept's related concepts
    for (const concept of allConcepts) {
      if (!concept.relatedConcepts) continue;

      try {
        const relatedConcepts = JSON.parse(concept.relatedConcepts);
        if (!Array.isArray(relatedConcepts)) continue;

        let hasChanges = false;
        const cleanedRelatedConcepts = [];

        for (const related of relatedConcepts) {
          if (typeof related === 'string') {
            // Check if this title still exists
            const normalizedTitle = related.toLowerCase().trim();
            if (validConceptTitles.has(normalizedTitle)) {
              // Convert to object format with ID if we can find it
              const conceptId = titleToIdMap.get(normalizedTitle);
              if (conceptId) {
                cleanedRelatedConcepts.push({ id: conceptId, title: related });
              } else {
                cleanedRelatedConcepts.push(related);
              }
            } else {
              hasChanges = true; // This reference is broken, skip it
            }
          } else if (typeof related === 'object' && related !== null) {
            // Check if ID exists
            if (related.id && validConceptIds.has(related.id)) {
              // Valid ID, keep it
              cleanedRelatedConcepts.push(related);
            } else if (related.title) {
              // Check if title exists
              const normalizedTitle = related.title.toLowerCase().trim();
              if (validConceptTitles.has(normalizedTitle)) {
                // Title exists, update with correct ID
                const conceptId = titleToIdMap.get(normalizedTitle);
                if (conceptId) {
                  cleanedRelatedConcepts.push({ id: conceptId, title: related.title });
                } else {
                  cleanedRelatedConcepts.push(related);
                }
              } else {
                hasChanges = true; // This reference is broken, skip it
              }
            } else {
              hasChanges = true; // Invalid entry, skip it
            }
          }
        }

        // Update the concept if we found broken references
        if (hasChanges) {
          await prisma.concept.update({
            where: { id: concept.id },
            data: { relatedConcepts: JSON.stringify(cleanedRelatedConcepts) }
          });
          console.log(`Cleaned up broken references for concept: ${concept.title}`);
        }
      } catch (error) {
        console.error(`Error cleaning related concepts for ${concept.title}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in cleanupBrokenRelatedConcepts:', error);
  }
}

// Function to update related concept references when a concept title changes
async function updateRelatedConceptReferences(conceptId: string, oldTitle: string, newTitle: string, userId: string): Promise<void> {
  try {
    // Find all concepts that reference this concept by title or ID
    const conceptsWithReferences = await prisma.concept.findMany({
      where: {
        userId,
        relatedConcepts: {
          contains: oldTitle // This is a simple search, we'll parse and check properly below
        }
      },
      select: { id: true, title: true, relatedConcepts: true }
    });

    for (const concept of conceptsWithReferences) {
      if (!concept.relatedConcepts) continue;

      try {
        const relatedConcepts = JSON.parse(concept.relatedConcepts);
        if (!Array.isArray(relatedConcepts)) continue;

        let hasChanges = false;
        const updatedRelatedConcepts = relatedConcepts.map(related => {
          if (typeof related === 'string') {
            if (related.toLowerCase().trim() === oldTitle.toLowerCase().trim()) {
              hasChanges = true;
              return { id: conceptId, title: newTitle };
            }
            return related;
          } else if (typeof related === 'object' && related !== null) {
            if (related.id === conceptId) {
              // Update the title
              hasChanges = true;
              return { ...related, title: newTitle };
            } else if (related.title && related.title.toLowerCase().trim() === oldTitle.toLowerCase().trim()) {
              // Update title-based reference
              hasChanges = true;
              return { id: conceptId, title: newTitle };
            }
            return related;
          }
          return related;
        });

        if (hasChanges) {
          await prisma.concept.update({
            where: { id: concept.id },
            data: { relatedConcepts: JSON.stringify(updatedRelatedConcepts) }
          });
          console.log(`Updated references in concept: ${concept.title}`);
        }
      } catch (error) {
        console.error(`Error updating references in ${concept.title}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in updateRelatedConceptReferences:', error);
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Fix for Next.js 15: await params before accessing properties
    const params = await context.params;
    const id = params.id;

    // Validate user session
    const user = await validateSession(request as NextRequest);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the concept with its code snippets - now with user validation
    const concept = await prisma.concept.findFirst({
      where: { 
        id,
        userId: user.id  // Ensure user can only access their own concepts
      },
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
    } catch (error) {
      console.error('Error parsing related concepts:', error);
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
      id: s.id,
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
    
    // Ensure LeetCode problems are consistently categorized
    if (cleanedConcept.title.match(/(valid anagram|two sum|contains duplicate|three sum|merge sorted|reverse linked|palindrome)/i) ||
        (cleanedConcept.title.toLowerCase().includes("problem") && cleanedConcept.category !== "LeetCode Problems")) {
      cleanedConcept.category = "LeetCode Problems";
    }
    
    if (keyPoints.length > 0) cleanedConcept.keyPoints = keyPoints;
    if (details.length > 0) cleanedConcept.details = details;
    if (codeSnippets.length > 0) cleanedConcept.codeSnippets = codeSnippets;
    if (relatedConceptData.length > 0) cleanedConcept.relatedConcepts = relatedConceptData;
    
    // Add enhancement fields
    if (concept.videoResources) cleanedConcept.videoResources = concept.videoResources;
    if (concept.commonMistakes) cleanedConcept.commonMistakes = concept.commonMistakes;
    if (concept.personalNotes) cleanedConcept.personalNotes = concept.personalNotes;

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
        // Parse the summary to get a concise title and description
        const summary = conv.summary || '';
        
        // Create a title that's distinct from the summary
        let title: string;
        
        // Check if the conversation object has any title property
        const conversationTitle = 'title' in conv ? (conv as any).title : undefined;
        
        // Option 1: If the conversation has a proper title that's not just the first line of the summary
        if (conversationTitle && typeof conversationTitle === 'string' && 
            conversationTitle.trim() !== "" && !summary.startsWith(conversationTitle)) {
          title = conversationTitle;
        } 
        // Option 2: Create a title based on the concept's name
        else if (concept && concept.title) {
          title = `Discussion about ${concept.title}`;
        }
        // Option 3: Use the first sentence if it's short enough
        else {
          const firstSentence = summary.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || '';
          title = firstSentence && firstSentence.length < 60 
            ? `Topic: ${firstSentence}` 
            : (conversationTitle || extractMeaningfulTitle(conv.text) || `Conversation ${conv.id.substring(0, 8)}`);
        }
        
        // Format conversation data for ConversationCard - match the home page format
        return {
          id: conv.id,
          title: title,
          date: conv.createdAt.toISOString(), // Convert date to ISO string
          summary: conv.summary || extractFocusedSummary(conv.text || '') || 'No summary available',
          // Include empty arrays for fields expected by ConversationCard
          concepts: [],
          conceptMap: []
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

      // Add to related concepts
      for (const concept of conceptsById) {
        relatedConcepts.push({
          id: concept.id,
          title: concept.title,
          category: concept.category,
          summary: concept.summary
        });
      }
    }

    // Fetch by Titles if available
    if (relatedConceptTitles.length > 0) {
      const conceptsByTitle = await prisma.concept.findMany({
        where: {
          title: {
            in: relatedConceptTitles
          }
        },
        include: {
          codeSnippets: true
        }
      });

      // Add to related concepts
      for (const concept of conceptsByTitle) {
        relatedConcepts.push({
          id: concept.id,
          title: concept.title,
          category: concept.category,
          summary: concept.summary
        });
      }
    }

    // Process occurrences by conversation
    const relatedConceptsByConversation: { [conversationId: string]: Array<{ id: string; title: string; category?: string; summary?: string; }> } = {};
    
    // Group the related concepts by conversation
    for (const conversation of relatedConversations) {
      const conversationId = conversation.id;
      
      // Initialize array for this conversation if it doesn't exist
      if (!relatedConceptsByConversation[conversationId]) {
        relatedConceptsByConversation[conversationId] = [];
      }
    }

    // For each occurrence, check which concepts appear alongside the main concept
    const newRelatedConcepts: Array<{ id: string; title: string; category?: string; summary?: string; }> = [];
    
    // Now find related concepts from actual concept associations in conversations
    if (relatedConversations.length > 0) {
      // Get conversation IDs
      const conversationIds = relatedConversations.map(conv => conv.id);
      
      // Get all occurrences for these conversations, except the main concept
      const otherOccurrences = await prisma.occurrence.findMany({
        where: {
          conversationId: {
            in: conversationIds
          },
          NOT: {
            conceptId: concept.id
          }
        },
        include: {
          concept: true
        }
      });
      
      // Group by conversation
      for (const occurrence of otherOccurrences) {
        if (!occurrence.concept) continue;
        
        const conversationId = occurrence.conversationId;
        
        if (relatedConceptsByConversation[conversationId]) {
          // Check if the concept is already in the list to avoid duplicates
          const newItem = {
            id: occurrence.concept.id,
            title: occurrence.concept.title,
            category: occurrence.concept.category,
            summary: occurrence.concept.summary
          };
          
          if (!relatedConceptsByConversation[conversationId].some(c => c.id === newItem.id)) {
            relatedConceptsByConversation[conversationId].push(newItem);
          }
          
          // Also add to the global list if not already there
          if (!newRelatedConcepts.some(c => c.id === newItem.id) && 
              !relatedConcepts.some(c => c.id === newItem.id)) {
            newRelatedConcepts.push(newItem);
          }
        }
      }
    }
    
    // Combine all related concepts
    const allRelatedConcepts = [...relatedConcepts, ...newRelatedConcepts];
    
    // Filter out any duplicates
    const uniqueRelatedConcepts = allRelatedConcepts.filter((rel, index, self) =>
      index === self.findIndex((t) => t.id === rel.id)
    );
    
    // EXCLUSION SYSTEM: Check if there are manually stored related concepts
    // If the concept has manually defined relatedConcepts (even if empty), 
    // this should take precedence over auto-calculated relationships
    let finalRelatedConcepts = uniqueRelatedConcepts;
    
    // If the concept has manually defined related concepts (including empty array for manual removal)
    if (relatedConceptData.length > 0 || (concept.relatedConcepts && concept.relatedConcepts !== null)) {
      console.log('Using manually defined relationships instead of auto-calculated ones');
      
      // Only include manually defined relationships, not auto-calculated ones
      finalRelatedConcepts = relatedConcepts; // Only the manually fetched ones
      
      // However, if manual list is empty but we had auto-calculated ones, 
      // it means user explicitly removed relationships - respect that
      if (relatedConcepts.length === 0 && relatedConceptData.length === 0) {
        console.log('Manual relationships explicitly empty - excluding all auto-calculated relationships');
        finalRelatedConcepts = [];
      }
    }
    
    // Calculate importance scores
    const relatedConceptsWithScores = finalRelatedConcepts.map(rel => ({
      ...rel,
      importanceScore: calculateConceptImportance(rel, relatedConversations)
    }));
    
    // Sort by importance score (highest first)
    relatedConceptsWithScores.sort((a, b) => b.importanceScore - a.importanceScore);

    const responseData = {
      concept: cleanedConcept,
      relatedConversations: relatedConversations,
      relatedConcepts: relatedConceptsWithScores.length > 0 ? relatedConceptsWithScores : undefined
    };

    return NextResponse.json(responseData);
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const params = await context.params;
    const id = params.id;
    
    // Validate user session
    const user = await validateSession(request as NextRequest);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const data = await request.json();
    
    // Check if we should preserve enhancements
    const preserveEnhancements = data.preserveEnhancements === true;
    
    // If updating category, remove any placeholder concepts from the target category
    if (data.category) {
      // First check if the concept being updated is not a placeholder itself
      const conceptBeingUpdated = await prisma.concept.findFirst({
        where: { 
          id,
          userId: user.id  // Ensure user owns the concept
        },
        select: { isPlaceholder: true }
      });
      
      // Only remove placeholders if the concept being moved is not a placeholder
      if (conceptBeingUpdated && !conceptBeingUpdated.isPlaceholder) {
        await removePlaceholderConcepts(data.category);
      }
    }
    
    // Check if the concept exists and belongs to the user
    const existingConcept = await prisma.concept.findFirst({
      where: { 
        id,
        userId: user.id  // Ensure user owns the concept
      },
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
    
    // Check if title is being changed and handle related concept references
    const oldTitle = existingConcept.title;
    const newTitle = data.title;
    const titleChanged = newTitle && newTitle !== oldTitle;
    
    // If title is changing, update all related concept references
    if (titleChanged) {
      console.log(`Title changing from "${oldTitle}" to "${newTitle}" - updating related concept references`);
      await updateRelatedConceptReferences(id, oldTitle, newTitle, user.id);
    }
    
    // Handle related concepts bidirectional relationships
    if (data.relatedConcepts !== undefined) {
      let newRelatedConcepts: RelatedConceptData[] = [];
      
      // Parse the new related concepts
      try {
        if (typeof data.relatedConcepts === 'string') {
          newRelatedConcepts = JSON.parse(data.relatedConcepts);
        } else if (Array.isArray(data.relatedConcepts)) {
          newRelatedConcepts = data.relatedConcepts;
        }
        
        // Ensure it's an array
        if (!Array.isArray(newRelatedConcepts)) {
          newRelatedConcepts = [];
        }
        
        // Filter out invalid entries and ensure unique IDs
        const uniqueIds = new Set<string>();
        newRelatedConcepts = newRelatedConcepts
          .filter(item => {
            if (!item || typeof item !== 'object') {
              return false;
            }
            // Must have either id or title
            const isValid = (item.id || item.title) && Object.keys(item).length > 0;
            if (isValid && item.id) {
              // Check for duplicates
              if (uniqueIds.has(item.id)) {
                return false;
              }
              uniqueIds.add(item.id);
            }
            return isValid;
          });
        
        // Get the existing related concepts
        let existingRelatedConcepts: RelatedConceptData[] = [];
        try {
          if (existingConcept.relatedConcepts) {
            if (typeof existingConcept.relatedConcepts === 'string') {
              existingRelatedConcepts = JSON.parse(existingConcept.relatedConcepts);
            } else if (Array.isArray(existingConcept.relatedConcepts)) {
              existingRelatedConcepts = existingConcept.relatedConcepts;
            }
          }
          
          if (!Array.isArray(existingRelatedConcepts)) {
            existingRelatedConcepts = [];
          }
        } catch (error) {
          console.error('Error parsing existing related concepts:', error);
          existingRelatedConcepts = [];
        }
        
        // Filter out invalid entries from existing concepts
        existingRelatedConcepts = existingRelatedConcepts.filter(item => 
          item && 
          typeof item === 'object' && 
          Object.keys(item).length > 0 &&
          (item.id || item.title)
        );
        
        // Find concepts that are being removed by comparing IDs
        const removedRelatedConcepts = existingRelatedConcepts.filter(existing => {
          if (typeof existing !== 'object') {
            return false;
          }
          
          const isRemoved = !newRelatedConcepts.some((newItem: RelatedConceptData) => {
            if (typeof existing === 'object' && existing !== null && typeof newItem === 'object' && newItem !== null) {
              if (existing.id && newItem.id) {
                return newItem.id === existing.id;
              }
              if (existing.title && newItem.title) {
                return newItem.title === existing.title;
              }
            }
            return false;
          });
          
          return isRemoved;
        });
        
        // Process removals - remove reverse relationships
        for (const removed of removedRelatedConcepts) {
          if (typeof removed !== 'object') continue;
          
          // Try to get the ID of the concept being removed
          const removedId = removed.id;
          if (!removedId) {
            continue;
          }
          
          // Get the related concept
          const relatedConcept = await prisma.concept.findUnique({
            where: { id: removedId },
            select: { relatedConcepts: true }
          });
          
          if (relatedConcept) {
            // Remove the reverse relationship
            try {
              let reverseRelated: RelatedConceptData[] = [];
              if (relatedConcept.relatedConcepts) {
                if (typeof relatedConcept.relatedConcepts === 'string') {
                  reverseRelated = JSON.parse(relatedConcept.relatedConcepts);
                } else if (Array.isArray(relatedConcept.relatedConcepts)) {
                  reverseRelated = relatedConcept.relatedConcepts;
                }
              }
              
              if (!Array.isArray(reverseRelated)) {
                reverseRelated = [];
              }
              
              // Filter out invalid entries
              reverseRelated = reverseRelated.filter(item => 
                item && 
                typeof item === 'object' && 
                Object.keys(item).length > 0 &&
                (item.id || item.title)
              );
              
              // Filter out the relationship by ID
              reverseRelated = reverseRelated.filter((rel: RelatedConceptData) => {
                if (typeof rel !== 'object') return true;
                return rel.id !== existingConcept.id;
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
        
        // Prepare update data
        const updateData: any = {
          // Core fields that can always be updated
          ...(data.category && { category: data.category }),
          ...(data.title && { title: data.title }),
          ...(data.summary && { summary: data.summary }),
          ...(data.keyPoints && { keyPoints: typeof data.keyPoints === 'string' 
            ? data.keyPoints 
            : JSON.stringify(data.keyPoints) }),
          ...(data.details && { details: typeof data.details === 'string' 
            ? data.details 
            : JSON.stringify(data.details) }),
          ...(data.examples && { examples: typeof data.examples === 'string' 
            ? data.examples 
            : JSON.stringify(data.examples) }),
          relatedConcepts: JSON.stringify(newRelatedConcepts),
        };

        // Only update enhancement fields if preserveEnhancements is false
        if (!preserveEnhancements) {
          Object.assign(updateData, {
            ...(data.videoResources !== undefined && { videoResources: data.videoResources }),
            ...(data.commonMistakes !== undefined && { commonMistakes: data.commonMistakes }),
            ...(data.personalNotes !== undefined && { personalNotes: data.personalNotes }),
            ...(data.masteryLevel !== undefined && { masteryLevel: data.masteryLevel }),
            ...(data.learningProgress !== undefined && { learningProgress: data.learningProgress }),
            ...(data.difficultyRating !== undefined && { difficultyRating: data.difficultyRating }),
            ...(data.timeToMaster !== undefined && { timeToMaster: data.timeToMaster }),
            ...(data.mnemonics !== undefined && { mnemonics: data.mnemonics }),
            ...(data.personalRating !== undefined && { personalRating: data.personalRating }),
            ...(data.bookmarked !== undefined && { bookmarked: data.bookmarked }),
            ...(data.documentationLinks && { documentationLinks: data.documentationLinks }),
            ...(data.practiceExercises && { practiceExercises: data.practiceExercises }),
            ...(data.realWorldExamples && { realWorldExamples: data.realWorldExamples }),
            ...(data.personalExamples && { personalExamples: data.personalExamples }),
            ...(data.learningTips && { learningTips: data.learningTips }),
            ...(data.useCases && { useCases: data.useCases }),
            ...(data.industries && { industries: data.industries }),
            ...(data.tools && { tools: data.tools }),
            ...(data.projectsUsedIn && { projectsUsedIn: data.projectsUsedIn }),
            ...(data.tags && { tags: data.tags }),
          });
        }

        // Update the concept with the new relationships
        const updatedConcept = await prisma.concept.update({
          where: { id },
          data: updateData,
        });

        // Clean up any broken related concept references for this user
        await cleanupBrokenRelatedConcepts(user.id);

        return NextResponse.json({
          success: true,
          concept: {
            id: updatedConcept.id,
            title: updatedConcept.title,
            category: updatedConcept.category,
            summary: updatedConcept.summary,
            relatedConcepts: updatedConcept.relatedConcepts
          },
        });
      } catch (error) {
        console.error("Error processing related concepts:", error);
      }
    }

    // If we get here, it means we're not updating related concepts
    // Prepare update data
    const updateData: any = {
      // Core fields that can always be updated
      ...(data.category && { category: data.category }),
      ...(data.title && { title: data.title }),
      ...(data.summary && { summary: data.summary }),
      ...(data.keyPoints && { keyPoints: typeof data.keyPoints === 'string' 
        ? data.keyPoints 
        : JSON.stringify(data.keyPoints) }),
      ...(data.details && { details: typeof data.details === 'string' 
        ? data.details 
        : JSON.stringify(data.details) }),
      ...(data.examples && { examples: typeof data.examples === 'string' 
        ? data.examples 
        : JSON.stringify(data.examples) }),
    };

    // Only update enhancement fields if preserveEnhancements is false
    if (!preserveEnhancements) {
      Object.assign(updateData, {
        // Enhanced learning fields
        ...(data.masteryLevel !== undefined && { masteryLevel: data.masteryLevel }),
        ...(data.learningProgress !== undefined && { learningProgress: data.learningProgress }),
        ...(data.difficultyRating !== undefined && { difficultyRating: data.difficultyRating }),
        ...(data.timeToMaster !== undefined && { timeToMaster: data.timeToMaster }),
        ...(data.personalNotes !== undefined && { personalNotes: data.personalNotes }),
        ...(data.mnemonics !== undefined && { mnemonics: data.mnemonics }),
        ...(data.personalRating !== undefined && { personalRating: data.personalRating }),
        ...(data.bookmarked !== undefined && { bookmarked: data.bookmarked }),
        
        // Array fields (stored as JSON strings)
        ...(data.videoResources && { videoResources: data.videoResources }),
        ...(data.documentationLinks && { documentationLinks: data.documentationLinks }),
        ...(data.practiceExercises && { practiceExercises: data.practiceExercises }),
        ...(data.realWorldExamples && { realWorldExamples: data.realWorldExamples }),
        ...(data.commonMistakes && { commonMistakes: data.commonMistakes }),
        ...(data.personalExamples && { personalExamples: data.personalExamples }),
        ...(data.learningTips && { learningTips: data.learningTips }),
        ...(data.useCases && { useCases: data.useCases }),
        ...(data.industries && { industries: data.industries }),
        ...(data.tools && { tools: data.tools }),
        ...(data.projectsUsedIn && { projectsUsedIn: data.projectsUsedIn }),
        ...(data.tags && { tags: data.tags }),
      });
    }

    const updatedConcept = await prisma.concept.update({
      where: { id },
      data: updateData,
    });

    // Clean up any broken related concept references for this user
    await cleanupBrokenRelatedConcepts(user.id);

    return NextResponse.json({
      success: true,
      concept: {
        id: updatedConcept.id,
        title: updatedConcept.title,
        category: updatedConcept.category,
        summary: updatedConcept.summary,
        relatedConcepts: updatedConcept.relatedConcepts
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const params = await context.params;
    const id = params.id;
    
    // Validate user session
    const user = await validateSession(request as NextRequest);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the concept exists and belongs to the user
    const existingConcept = await prisma.concept.findFirst({
      where: { 
        id,
        userId: user.id  // Ensure user owns the concept
      },
      select: {
        id: true,
        conversationId: true
      }
    });

    if (!existingConcept) {
      return NextResponse.json(
        { error: 'Concept not found' },
        { status: 404 }
      );
    }

    // Store the conversationId for later use
    const conversationId = existingConcept.conversationId;

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

    // Check if the conversation has any remaining concepts
    const remainingConceptCount = await prisma.concept.count({
      where: { conversationId: conversationId }
    });

    let deletedConversation = false;
    
    // If no concepts remain, delete the conversation
    if (remainingConceptCount === 0) {
      await prisma.conversation.delete({
        where: { id: conversationId }
      });
      deletedConversation = true;
    }

    return NextResponse.json({ 
      success: true,
      conversationDeleted: deletedConversation,
      conversationId: deletedConversation ? conversationId : null
    });
  } catch (error) {
    console.error('Error deleting concept:', error);
    return NextResponse.json(
      { error: 'Failed to delete concept' },
      { status: 500 }
    );
  }
}

// Helper function to check conversation count for a concept
export async function getConversationCount(conceptId: string, userId: string): Promise<number> {
  try {
    const conversationCount = await prisma.conversation.count({
      where: {
        userId,
        concepts: {
          some: {
            id: conceptId
          }
        }
      }
    });
    
    return conversationCount;
  } catch (error) {
    console.error('Error getting conversation count:', error);
    return 0;
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
  const lowerTitle = title.toLowerCase();
  
  // Check for LeetCode problems first
  if (lowerTitle.match(/(valid anagram|two sum|contains duplicate|three sum|merge sorted|reverse linked|palindrome)/i) ||
      lowerTitle.includes("problem")) {
    return "LeetCode Problems";
  }
  
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