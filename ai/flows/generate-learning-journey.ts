import OpenAI from 'openai';

interface ConceptInfo {
  title: string;
  summary: string;
}

interface LearningJourneyAnalysis {
  summary: string;
  analyses: Array<{
    conceptTitle: string;
    isLearningNewTopic: boolean;
    masteredPrerequisites: string[];
    suggestedNextSteps: string[];
    learningProgress: number;
  }>;
}

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function constructPrompt(newConcepts: any[], existingConcepts: any[]): string {
  // Note: The `existingConcepts` parameter is now less important, as the rich context is attached to each new concept.
  
  const newConceptsStr = newConcepts.map(c => {
    const similarConceptsStr = c.similarExistingConcepts && c.similarExistingConcepts.length > 0
      ? `(Similar to your existing concepts: ${c.similarExistingConcepts.map((sc: any) => sc.title).join(', ')})`
      : '(This appears to be a completely new topic for you)';
    
    return `- ${c.title} ${similarConceptsStr}: ${c.summary}`;
  }).join('\n');

  return `
    As an expert learning coach, analyze the relationship between a user's new concepts and their existing knowledge base.

    **New Concepts from Current Analysis:**
    The user has just analyzed text containing these new concepts. I have already performed a vector similarity search and provided the results for you.
    ${newConceptsStr}

    **Your Task:**
    Generate a "learning journey" analysis. For each of the **new** concepts, provide the following:
    1.  **isLearningNewTopic**: boolean - Based on the similarity search result, is this a new topic?
    2.  **masteredPrerequisites**: string[] - Based on their existing knowledge (indicated by the similarity search), list up to 3 concepts they already know that are direct prerequisites for this new one. If none, provide an empty array.
    3.  **suggestedNextSteps**: string[] - List up to 3 logical next concepts to study after this one.
    4.  **learningProgress**: number - A mocked progress value (e.g., 0.0 for new, 0.75 if it's very similar to an existing concept).

    Additionally, provide an overall **summary** (2-3 sentences) of their current learning trajectory based on this analysis.

    **Output Format:**
    Return a single, valid JSON object matching this structure:
    {
      "summary": "Your overall learning trajectory summary.",
      "analyses": [
        {
          "conceptTitle": "Title of New Concept 1",
          "isLearningNewTopic": true,
          "masteredPrerequisites": ["Prereq A", "Prereq B"],
          "suggestedNextSteps": ["Next Step X", "Next Step Y"],
          "learningProgress": 0.0
        }
      ]
    }
    Do not include any text, markdown, or code fences outside of the JSON object.
  `;
}

export async function generateLearningJourney(newConcepts: ConceptInfo[], existingConcepts: ConceptInfo[]): Promise<LearningJourneyAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  if (newConcepts.length === 0) {
    return { summary: '', analyses: [] };
  }

  const prompt = constructPrompt(newConcepts, existingConcepts);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106", // Use a model that is good at following JSON format instructions
      messages: [
        {
          role: "system",
          content: "You are an expert learning coach that analyzes user knowledge and provides personalized learning paths. You always respond in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }, // Enforce JSON output
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("Received empty response from AI.");
    }

    const parsedContent = JSON.parse(content) as LearningJourneyAnalysis;
    return parsedContent;

  } catch (error) {
    console.error("Error generating learning journey:", error);
    // Return a default structure on error to prevent frontend crashes
    return {
      summary: "Could not generate learning journey analysis at this time.",
      analyses: newConcepts.map(c => ({
        conceptTitle: c.title,
        isLearningNewTopic: true,
        masteredPrerequisites: [],
        suggestedNextSteps: [],
        learningProgress: 0.0
      }))
    };
  }
} 