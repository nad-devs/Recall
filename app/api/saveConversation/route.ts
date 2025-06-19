import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { getClientIP, canMakeServerConversation } from '@/lib/usage-tracker-server';

interface Concept {
  title: string;
  category: string;
  summary: string;
  keyPoints: string[];
  details?: string;
  examples?: string[];
  relatedConcepts?: string[];
  relationships?: Record<string, any>;
  codeSnippets?: Array<{
    language: string;
    description: string;
    code: string;
  }>;
  videoResources?: string;
  // Enhanced learning fields from AI analysis
  masteryLevel?: string;
  difficultyRating?: number;
  timeToMaster?: number;
  learningTips?: string[];
  embeddingData?: {
    concept: any;
    relationships: Array<{
      id: string;
      title: string;
      category: string;
      summary: string;
      similarity: number;
      relationshipType?: string;
      reason?: string;
      context?: string[];
      sharedElements?: string[];
    }>;
    potentialDuplicates: Array<{
      id: string;
      title: string;
      category: string;
      summary: string;
      similarity: number;
      relationshipType?: string;
      reason?: string;
      context?: string[];
      sharedElements?: string[];
    }>;
    embedding: number[];
  };
  keyTakeaway?: string;
  analogy?: string;
  practicalTips?: string[];
  confidenceScore?: number;
}

// Let the backend provide proper categories - just fallback to General if none provided
function guessCategoryFromTitle(title: string): string {
  return 'General';
}

export async function POST(request: Request) {
  try {
    const { conversation_text, analysis, confirmUpdate = false, customApiKey, userInfo } = await request.json();
    
    // Get client information for usage tracking
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Try to get authenticated user first
    let user = await validateSession(request as any);
    
    // If no authenticated user but we have userInfo, try to find or create user
    if (!user && userInfo) {
      try {
        // Try to find existing user by email
        let existingUser = await prisma.user.findUnique({
          where: { email: userInfo.email.toLowerCase().trim() }
        });
        
        if (!existingUser) {
          // Create new user for email-based authentication
          existingUser = await prisma.user.create({
            data: {
              name: userInfo.name,
              email: userInfo.email.toLowerCase().trim(),
              emailVerified: null, // Email-based users don't need verification
              lastActiveAt: new Date(),
            }
          });
        } else {
          // Update last active time
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastActiveAt: new Date() }
          });
        }
        
        user = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          isEmailBased: true
        };
      } catch (error) {
        console.error('Error creating/finding user:', error);
      }
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Validate the custom API key if provided
    let validatedApiKey = false;
    if (customApiKey && customApiKey.trim()) {
      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${customApiKey.trim()}`
          }
        });
        
        if (testResponse.ok) {
          validatedApiKey = true;
          console.log('✅ Custom API key validated successfully');
        } else {
          console.log('❌ Custom API key validation failed:', testResponse.status);
        }
      } catch (error) {
        console.log('❌ Custom API key validation error:', error);
      }
    }

    // Check if user can make a conversation (server-side validation)
    // Skip this check for authenticated users or users with valid API keys
    if (!user.isEmailBased && !validatedApiKey) {
      const canMake = await canMakeServerConversation(clientIP, userAgent, customApiKey || null);
      if (!canMake) {
        return NextResponse.json({ 
          success: false, 
          error: 'You have reached the 25 free conversation limit. Please add your OpenAI API key to continue.',
          requiresApiKey: true
        }, { status: 403 });
      }
    }
    
    console.log("🔍 SERVER RECEIVED DATA:");
    console.log("📝 Conversation text length:", conversation_text?.length || 0);
    console.log("📊 Analysis object:", JSON.stringify(analysis, null, 2));
    
    if (analysis) {
      console.log("📋 analysis.concepts:", analysis.concepts);
      console.log("📋 analysis.conceptMap:", analysis.conceptMap);
      console.log("📋 analysis.conversation_summary:", analysis.conversation_summary);
      console.log("📋 Type of analysis.concepts:", typeof analysis.concepts);
      console.log("📋 Is analysis.concepts array?", Array.isArray(analysis.concepts));
      if (analysis.concepts && Array.isArray(analysis.concepts)) {
        console.log("📋 Number of concepts:", analysis.concepts.length);
        analysis.concepts.forEach((concept: any, index: number) => {
          console.log(`📋 Concept ${index + 1}:`, JSON.stringify(concept, null, 2));
        });
      }
    }
    
    // Validate input - ensure we have the minimum required data
    if (!conversation_text || conversation_text.trim() === '') {
      console.error("Missing conversation text");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing conversation text' 
      }, { status: 400 });
    }

    // Ensure analysis is never undefined for the rest of the processing
    const safeAnalysis = analysis || { concepts: [] };

    // Get concepts from conceptMap or concepts array
    let conceptsToProcess: Concept[] = [];
    
    console.log("🔄 PROCESSING CONCEPTS:");
    console.log("🔄 safeAnalysis.concepts exists?", !!safeAnalysis.concepts);
    console.log("🔄 safeAnalysis.concepts length:", safeAnalysis.concepts?.length || 0);
    console.log("🔄 safeAnalysis.conceptMap exists?", !!safeAnalysis.conceptMap);
    console.log("🔄 safeAnalysis.conceptMap length:", safeAnalysis.conceptMap?.length || 0);
    
    // Process concepts from the analysis.concepts array if available
    if (safeAnalysis.concepts && safeAnalysis.concepts.length > 0) {
      console.log("✅ Using analysis.concepts array");
      conceptsToProcess = safeAnalysis.concepts;
    } 
    // If we have a conceptMap array, create concepts from it
    else if (safeAnalysis.conceptMap && Array.isArray(safeAnalysis.conceptMap) && safeAnalysis.conceptMap.length > 0) {
      console.log("⚠️ Falling back to conceptMap array");
      // Convert each concept name to a concept object
      conceptsToProcess = safeAnalysis.conceptMap.map((title: string) => ({
        title,
        category: guessCategoryFromTitle(title),
        summary: '',
        keyPoints: [],
        details: '',
        examples: [],
        relatedConcepts: [],
        relationships: {},
        codeSnippets: [],
        videoResources: ''
      }));
    }

    // No concepts found to process - continue with creating generic concepts
    if (conceptsToProcess.length === 0) {
      console.log("No concepts found in analysis - attempting to create generic concepts");
      
      const summary = safeAnalysis.conversation_summary || '';
      const firstSentences = conversation_text.split(/[.!?]/).slice(0, 2).join('. ');
      const title = firstSentences.length > 50 
        ? firstSentences.substring(0, 50) + '...' 
        : (firstSentences || 'Programming Discussion');
        
      conceptsToProcess.push({
        title: title,
        category: "General",
        summary: summary || "Conversation about programming topics",
        keyPoints: ["Extracted from conversation"],
        relatedConcepts: [],
        videoResources: ''
      });
      
      console.log("Created generic fallback concept:", title);
    }

    // --- STAGE 2: PARALLEL ENRICHMENT ---
    // With our source-of-truth concepts, we now enrich them with practical summaries.
    const DISTILLER_SERVICE_URL = process.env.JOURNEY_ANALYSIS_URL; // Using the journey URL as our distiller
    if (DISTILLER_SERVICE_URL && conceptsToProcess.length > 0) {
      console.log(` distillery...`);
      try {
        const enrichmentPromises = conceptsToProcess.map(concept =>
          fetch(DISTILLER_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // Send the full context to the distiller service
              concept_details: {
                title: concept.title,
                summary: concept.summary,
                keyPoints: concept.keyPoints
              },
              conversation_text: conversation_text,
              custom_api_key: customApiKey
            }),
          }).then(res => res.ok ? res.json() : null) // Gracefully handle errors per-concept
        );

        const enrichmentResults = await Promise.all(enrichmentPromises);

        // Merge the practical summaries back into our main concept objects
        conceptsToProcess = conceptsToProcess.map((concept, index) => {
          const result = enrichmentResults[index];
          if (result && result.practical_summary) {
            return {
              ...concept,
              keyTakeaway: result.practical_summary.key_takeaway,
              analogy: result.practical_summary.analogy,
              practicalTips: result.practical_summary.practical_tips,
            };
          }
          return concept; // Return original concept if enrichment failed
        });
        console.log("✅ Concepts enriched with practical summaries.");
      } catch (error) {
        console.error("Error during concept enrichment, continuing with base concepts:", error);
      }
    }
    // --- END OF STAGE 2 ---

    console.log("🎯 FINAL CONCEPTS TO PROCESS:");
    conceptsToProcess.forEach((concept: any, index: number) => {
      console.log(`🎯 Final Concept ${index + 1}:`, {
        title: concept.title,
        category: concept.category,
        summary: concept.summary?.substring(0, 100) + '...',
        hasDetails: !!concept.details,
        hasKeyPoints: !!concept.keyPoints,
        hasCodeSnippets: !!concept.codeSnippets,
        hasVideoResources: !!concept.videoResources,
        hasKeyTakeaway: !!concept.keyTakeaway,
        hasAnalogy: !!concept.analogy,
      });
    });

    console.log("💾 CREATING CONVERSATION IN DATABASE...");
    // Create the conversation for source tracking
    const conversationData: any = {
      text: conversation_text,
      summary: analysis?.conversation_summary || '',
      createdAt: new Date(),
      userId: user.id
    };
    
    if (analysis?.conversation_title) {
      conversationData.title = analysis.conversation_title;
    }
    
    const conversation = await prisma.conversation.create({
      data: conversationData,
    });

    console.log("✅ CONVERSATION CREATED:", {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      summary: conversation.summary?.substring(0, 100) + '...',
      textLength: conversation.text.length
    });

    // Store created concept IDs
    const createdConceptIds = new Map<string, string>();

    console.log("💾 CREATING CONCEPTS IN DATABASE...");

    // Process each concept and save to database
    for (const conceptData of conceptsToProcess) {
      try {
        console.log(`💾 Processing concept: ${conceptData.title}`);
        
        // Check if there are any existing concepts with high similarity
        const similarConcepts = await prisma.concept.findMany({
          where: {
            userId: user.id,
            title: {
              in: conceptData.embeddingData?.potentialDuplicates.map((p: any) => p.title) || [],
            },
          },
        });

        if (similarConcepts.length > 0 && !confirmUpdate) {
          // If similar concepts exist and user hasn't confirmed, ask for confirmation
          console.log(`Found ${similarConcepts.length} similar concepts. Asking for confirmation.`);
          return NextResponse.json({
            success: false,
            error: 'Similar concepts found. Please confirm to update.',
            requiresConfirmation: true,
            similarConcepts: similarConcepts.map(c => c.title)
          }, { status: 409 });
        }

        // We'll handle duplicates/updates later. For now, we create new concepts.
        const conceptToCreate: any = {
          title: conceptData.title,
          category: conceptData.category || "General",
          summary: conceptData.summary || "No summary provided",
          details: JSON.stringify(conceptData.details || {}),
          keyPoints: JSON.stringify(conceptData.keyPoints || []),
          examples: JSON.stringify(conceptData.examples || []),
          relatedConcepts: JSON.stringify(conceptData.relatedConcepts || []),
          relationships: JSON.stringify(conceptData.relationships || {}),
          videoResources: conceptData.videoResources 
            ? (typeof conceptData.videoResources === 'string' 
                ? JSON.stringify([conceptData.videoResources]) // Single URL -> JSON array
                : JSON.stringify(conceptData.videoResources))   // Already an array -> JSON string
            : '[]', // Default to empty array
          // Enhanced learning fields from AI analysis
          masteryLevel: conceptData.masteryLevel || null,
          difficultyRating: conceptData.difficultyRating || null,
          timeToMaster: conceptData.timeToMaster || null,
          learningTips: JSON.stringify(conceptData.learningTips || []),
          confidenceScore: conceptData.confidenceScore || 0.5,
          keyTakeaway: conceptData.keyTakeaway,
          analogy: conceptData.analogy,
          practicalTips: JSON.stringify(conceptData.practicalTips || []),
          userId: user.id,
          conversationId: conversation.id,
        };
        
        // Create the concept first (without embedding)
        const newConcept = await prisma.concept.create({
          data: conceptToCreate,
        });

        // Add embedding separately using raw SQL if available
        if (conceptData.embeddingData && conceptData.embeddingData.embedding) {
          try {
            const vector = JSON.stringify(conceptData.embeddingData.embedding);
            await prisma.$executeRaw`
              UPDATE "Concept" 
              SET embedding = ${vector}::vector 
              WHERE id = ${newConcept.id}
            `;
            console.log(`💾 Added embedding for concept: ${conceptData.title}`);
          } catch (error) {
            console.warn(`⚠️ Could not add embedding for concept ${conceptData.title}:`, error);
          }
        }
        
        createdConceptIds.set(conceptData.title, newConcept.id);
        console.log(`✅ Created concept: ${newConcept.id} - ${newConcept.title}`);

        // Create code snippets if they exist
        if (conceptData.codeSnippets && conceptData.codeSnippets.length > 0) {
          console.log(`💾 Creating ${conceptData.codeSnippets.length} code snippets for concept: ${newConcept.title}`);
          
          for (const snippet of conceptData.codeSnippets) {
            try {
              await prisma.codeSnippet.create({
                data: {
                  language: snippet.language || 'text',
                  description: snippet.description || '',
                  code: snippet.code || '',
                  conceptId: newConcept.id,
                },
              });
              console.log(`✅ Created code snippet for concept: ${newConcept.title}`);
            } catch (snippetError) {
              console.error(`❌ Error creating code snippet for concept ${newConcept.title}:`, snippetError);
            }
          }
        }

        // Create occurrence record to track this concept in this conversation
        await prisma.occurrence.create({
          data: {
            conversationId: conversation.id,
            conceptId: newConcept.id,
            notes: conceptData.summary || '',
          }
        });

        // AUTO-CREATE RELATIONSHIPS: Store in the relationships JSON field and update related concepts
        if (conceptData.embeddingData && conceptData.embeddingData.relationships) {
          console.log(`🔗 Auto-creating ${conceptData.embeddingData.relationships.length} relationships for: ${conceptData.title}`);
          
          // Prepare relationships data for the new concept
          const relationshipsData = {
            relatedConcepts: conceptData.embeddingData.relationships.map(rel => ({
              id: rel.id,
              title: rel.title,
              similarity: rel.similarity,
              type: 'RELATED',
              autoLinked: true,
              linkedAt: new Date().toISOString(),
              relationshipType: rel.relationshipType,
              reason: rel.reason,
              context: rel.context,
              sharedElements: rel.sharedElements
            })),
            potentialDuplicates: conceptData.embeddingData.potentialDuplicates?.map(dup => ({
              id: dup.id,
              title: dup.title,
              similarity: dup.similarity,
              type: 'DUPLICATE',
              autoLinked: true,
              linkedAt: new Date().toISOString(),
              relationshipType: dup.relationshipType,
              reason: dup.reason,
              context: dup.context,
              sharedElements: dup.sharedElements
            })) || []
          };

          // Update the newly created concept with relationship data
          await prisma.concept.update({
            where: { id: newConcept.id },
            data: {
              relationships: JSON.stringify(relationshipsData)
            }
          });

          // BIDIRECTIONAL LINKING: Update the related concepts to link back to this new concept
          for (const relatedConcept of conceptData.embeddingData.relationships) {
            try {
              // Get the existing concept
              const existingConcept = await prisma.concept.findUnique({
                where: { id: relatedConcept.id }
              });

              if (existingConcept) {
                // Parse existing relationships
                let existingRelationships;
                try {
                  existingRelationships = existingConcept.relationships ? 
                    JSON.parse(existingConcept.relationships) : 
                    { relatedConcepts: [], potentialDuplicates: [] };
                } catch (parseError) {
                  // If parsing fails, start fresh
                  existingRelationships = { relatedConcepts: [], potentialDuplicates: [] };
                }

                // Check if this relationship already exists
                const alreadyLinked = existingRelationships.relatedConcepts?.some((rel: any) => 
                  rel.id === newConcept.id
                );

                if (!alreadyLinked) {
                  // Add the new concept as a related concept
                  if (!existingRelationships.relatedConcepts) {
                    existingRelationships.relatedConcepts = [];
                  }
                  
                  existingRelationships.relatedConcepts.push({
                    id: newConcept.id,
                    title: conceptData.title,
                    similarity: relatedConcept.similarity,
                    type: 'RELATED',
                    autoLinked: true,
                    linkedAt: new Date().toISOString(),
                    relationshipType: relatedConcept.relationshipType,
                    reason: relatedConcept.reason,
                    context: relatedConcept.context,
                    sharedElements: relatedConcept.sharedElements
                  });

                  // Update the existing concept with the new relationship
                  await prisma.concept.update({
                    where: { id: relatedConcept.id },
                    data: {
                      relationships: JSON.stringify(existingRelationships)
                    }
                  });

                  console.log(`✅ Auto-linked "${conceptData.title}" ↔ "${relatedConcept.title}" (${relatedConcept.similarity}% similarity)`);
                } else {
                  console.log(`⚠️ Relationship already exists: "${conceptData.title}" ↔ "${relatedConcept.title}"`);
                }
              }
            } catch (relationError) {
              console.error(`❌ Error creating bidirectional relationship for ${conceptData.title} → ${relatedConcept.title}:`, relationError);
            }
          }

          // HANDLE POTENTIAL DUPLICATES: Update related concepts with duplicate flags
          if (conceptData.embeddingData.potentialDuplicates && conceptData.embeddingData.potentialDuplicates.length > 0) {
            console.log(`🟠 Found ${conceptData.embeddingData.potentialDuplicates.length} potential duplicates for: ${conceptData.title}`);
            
            for (const duplicate of conceptData.embeddingData.potentialDuplicates) {
              try {
                const existingConcept = await prisma.concept.findUnique({
                  where: { id: duplicate.id }
                });

                if (existingConcept) {
                  let existingRelationships;
                  try {
                    existingRelationships = existingConcept.relationships ? 
                      JSON.parse(existingConcept.relationships) : 
                      { relatedConcepts: [], potentialDuplicates: [] };
                  } catch (parseError) {
                    existingRelationships = { relatedConcepts: [], potentialDuplicates: [] };
                  }

                  // Check if duplicate flag already exists
                  const alreadyFlagged = existingRelationships.potentialDuplicates?.some((dup: any) => 
                    dup.id === newConcept.id
                  );

                  if (!alreadyFlagged) {
                    if (!existingRelationships.potentialDuplicates) {
                      existingRelationships.potentialDuplicates = [];
                    }
                    
                    existingRelationships.potentialDuplicates.push({
                      id: newConcept.id,
                      title: conceptData.title,
                      similarity: duplicate.similarity,
                      type: 'DUPLICATE',
                      autoLinked: true,
                      linkedAt: new Date().toISOString(),
                      relationshipType: duplicate.relationshipType,
                      reason: duplicate.reason,
                      context: duplicate.context,
                      sharedElements: duplicate.sharedElements
                    });

                    await prisma.concept.update({
                      where: { id: duplicate.id },
                      data: {
                        relationships: JSON.stringify(existingRelationships)
                      }
                    });

                    console.log(`🟠 Flagged as potential duplicate: "${conceptData.title}" ↔ "${duplicate.title}" (${duplicate.similarity}% similarity)`);
                  }
                }
              } catch (duplicateError) {
                console.error(`❌ Error flagging duplicate relationship:`, duplicateError);
              }
            }
          }
        }

      } catch (error) {
        console.error(`❌ Error creating concept ${conceptData.title}:`, error);
        // Continue with other concepts even if one fails
        continue;
      }
    }

    console.log("📊 Final Results:", {
      conversationId: conversation.id,
      conceptCount: Array.from(createdConceptIds.values()).length,
      conceptIds: Array.from(createdConceptIds.values()),
      conceptTitles: Array.from(createdConceptIds.keys()),
      userId: user.id,
      userEmail: user.email
    });

    // Return a success response with redirect to the concepts page
    const response = { 
      success: true, 
      message: "Concepts extracted and saved successfully",
      conversationId: conversation.id,
      conceptIds: Array.from(createdConceptIds.values()),
      conceptCount: Array.from(createdConceptIds.values()).length,
      redirectTo: `/concepts`
    };
    
    console.log("📤 SENDING RESPONSE:", response);
    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error saving concepts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to extract and save concepts' 
    }, { status: 500 });
  }
} 