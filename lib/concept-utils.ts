/**
 * Helper functions to work with concept relationships
 */

/**
 * Helper function to parse related concepts from various formats
 * @param relatedConcepts The related concepts data to parse
 * @returns Parsed array of related concepts
 */
function parseRelatedConcepts(relatedConcepts: any): any[] {
  let parsed = [];
  
  try {
    if (typeof relatedConcepts === 'string') {
      parsed = JSON.parse(relatedConcepts || '[]');
    } else if (Array.isArray(relatedConcepts)) {
      parsed = relatedConcepts;
    }
    
    if (!Array.isArray(parsed)) {
      parsed = [];
    }
  } catch (error) {
    console.error('Error parsing related concepts:', error);
    parsed = [];
  }
  
  return parsed;
}

/**
 * Checks if two concepts are already related
 * @param relatedConcepts Array of related concepts
 * @param conceptToCheck The concept to check for relationship
 * @returns boolean indicating if they are related
 */
function isRelated(relatedConcepts: any[], conceptToCheck: any): boolean {
  return relatedConcepts.some((related: any) => {
    if (typeof related === 'string') {
      return related === conceptToCheck.title || related === conceptToCheck.id;
    } else if (typeof related === 'object' && related !== null) {
      return related.id === conceptToCheck.id || 
             (related.title && related.title === conceptToCheck.title);
    }
    return false;
  });
}

/**
 * Adds a bidirectional relationship between two concepts
 * @param sourceConceptId ID of the first concept
 * @param targetConceptId ID of the second concept
 * @returns Promise resolving when the operation is completed
 */
export async function connectConcepts(sourceConceptId: string, targetConceptId: string): Promise<void> {
  try {
    console.log(`🔗 Starting connection between concepts ${sourceConceptId} and ${targetConceptId}`);
    
    // Get both concepts
    const [sourceResponse, targetResponse] = await Promise.all([
      fetch(`/api/concepts/${sourceConceptId}`),
      fetch(`/api/concepts/${targetConceptId}`)
    ]);
    
    if (!sourceResponse.ok || !targetResponse.ok) {
      throw new Error('Failed to fetch one or both concepts');
    }
    
    const sourceConceptData = await sourceResponse.json();
    const targetConceptData = await targetResponse.json();
    
    console.log("🔍 Source concept data:", sourceConceptData);
    console.log("🔍 Target concept data:", targetConceptData);
    
    // Access the actual concept data (API returns { concept: {...}, relatedConcepts: [...] })
    const sourceConcept = sourceConceptData.concept;
    const targetConcept = targetConceptData.concept;
    
    if (!sourceConcept || !targetConcept) {
      throw new Error('Invalid concept data received from API');
    }
    
    // Parse related concepts arrays from the concept's manual relatedConcepts field
    let sourceRelatedConcepts = parseRelatedConcepts(sourceConcept.relatedConcepts);
    let targetRelatedConcepts = parseRelatedConcepts(targetConcept.relatedConcepts);
    
    console.log("📝 Source current manual relationships:", sourceRelatedConcepts);
    console.log("📝 Target current manual relationships:", targetRelatedConcepts);
    
    // Check if the relationship already exists
    const sourceHasTarget = isRelated(sourceRelatedConcepts, targetConcept);
    const targetHasSource = isRelated(targetRelatedConcepts, sourceConcept);
    
    console.log("🔍 Source already has target?", sourceHasTarget);
    console.log("🔍 Target already has source?", targetHasSource);
    
    // Add relationships if they don't exist
    if (!sourceHasTarget) {
      sourceRelatedConcepts.push({
        id: targetConcept.id,
        title: targetConcept.title
      });
      console.log("➕ Added target to source relationships");
    }
    
    if (!targetHasSource) {
      targetRelatedConcepts.push({
        id: sourceConcept.id,
        title: sourceConcept.title
      });
      console.log("➕ Added source to target relationships");
    }
    
    console.log("📝 Final source relationships to save:", sourceRelatedConcepts);
    console.log("📝 Final target relationships to save:", targetRelatedConcepts);
    
    // Update both concepts
    const [sourceUpdateResponse, targetUpdateResponse] = await Promise.all([
      fetch(`/api/concepts/${sourceConceptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          relatedConcepts: sourceRelatedConcepts // Send as array, not JSON string
        })
      }),
      fetch(`/api/concepts/${targetConceptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          relatedConcepts: targetRelatedConcepts // Send as array, not JSON string
        })
      })
    ]);
    
    console.log("📡 Source update response status:", sourceUpdateResponse.status);
    console.log("📡 Target update response status:", targetUpdateResponse.status);
    
    if (!sourceUpdateResponse.ok || !targetUpdateResponse.ok) {
      const sourceError = sourceUpdateResponse.ok ? null : await sourceUpdateResponse.text();
      const targetError = targetUpdateResponse.ok ? null : await targetUpdateResponse.text();
      console.error("❌ Update errors:", { sourceError, targetError });
      throw new Error(`Failed to update concepts: ${sourceError || targetError}`);
    }
    
    const sourceResult = await sourceUpdateResponse.json();
    const targetResult = await targetUpdateResponse.json();
    
    console.log("✅ Source update result:", sourceResult);
    console.log("✅ Target update result:", targetResult);
    console.log("🎉 Successfully connected concepts!");
    
  } catch (error) {
    console.error('❌ Error connecting concepts:', error);
    throw error;
  }
}

/**
 * Removes a bidirectional relationship between two concepts
 * @param sourceConceptId ID of the first concept
 * @param targetConceptId ID of the second concept
 * @returns Promise resolving when the operation is completed
 */
export async function disconnectConcepts(sourceConceptId: string, targetConceptId: string): Promise<void> {
  try {
    console.log(`Starting disconnection between concepts ${sourceConceptId} and ${targetConceptId}`);
    
    // Get both concepts
    const [sourceResponse, targetResponse] = await Promise.all([
      fetch(`/api/concepts/${sourceConceptId}`),
      fetch(`/api/concepts/${targetConceptId}`)
    ]);
    
    if (!sourceResponse.ok || !targetResponse.ok) {
      throw new Error('Failed to fetch one or both concepts');
    }
    
    const sourceConceptData = await sourceResponse.json();
    const targetConceptData = await targetResponse.json();
    
    console.log("Source concept before unlinking:", sourceConceptData);
    console.log("Target concept before unlinking:", targetConceptData);
    
    // Check where the relationships are coming from
    const sourceManualRelated = parseRelatedConcepts(sourceConceptData.concept?.relatedConcepts);
    const targetManualRelated = parseRelatedConcepts(targetConceptData.concept?.relatedConcepts);
    const sourceAutoRelated = sourceConceptData.relatedConcepts || [];
    const targetAutoRelated = targetConceptData.relatedConcepts || [];
    
    console.log("Source manual related concepts:", sourceManualRelated);
    console.log("Source auto-calculated related concepts:", sourceAutoRelated.map((r: any) => ({ id: r.id, title: r.title })));
    console.log("Target manual related concepts:", targetManualRelated);
    console.log("Target auto-calculated related concepts:", targetAutoRelated.map((r: any) => ({ id: r.id, title: r.title })));
    
    // Check if the relationship exists in auto-calculated relationships
    const sourceHasAutoRelationship = sourceAutoRelated.some((rel: any) => rel.id === targetConceptId);
    const targetHasAutoRelationship = targetAutoRelated.some((rel: any) => rel.id === sourceConceptId);
    
    console.log("Source has auto relationship with target:", sourceHasAutoRelationship);
    console.log("Target has auto relationship with source:", targetHasAutoRelationship);
    
    // Prepare the new manual relationships
    let newSourceRelatedConcepts = [...sourceManualRelated];
    let newTargetRelatedConcepts = [...targetManualRelated];
    
    // Remove any existing manual relationships
    newSourceRelatedConcepts = newSourceRelatedConcepts.filter(related => {
      if (typeof related === 'string') {
        return related !== targetConceptData.concept?.title && related !== targetConceptId;
      } else if (typeof related === 'object' && related !== null) {
        return related.id !== targetConceptId && related.title !== targetConceptData.concept?.title;
      }
      return true;
    });
    
    newTargetRelatedConcepts = newTargetRelatedConcepts.filter(related => {
      if (typeof related === 'string') {
        return related !== sourceConceptData.concept?.title && related !== sourceConceptId;
      } else if (typeof related === 'object' && related !== null) {
        return related.id !== sourceConceptId && related.title !== sourceConceptData.concept?.title;
      }
      return true;
    });
    
    // If this was an auto-calculated relationship, we need to override it by preserving other relationships
    if (sourceHasAutoRelationship || targetHasAutoRelationship) {
      console.log("This is an auto-calculated relationship - creating explicit exclusion while preserving other relationships");
      
      // For source: keep all existing manual relationships except the target
      // For target: keep all existing manual relationships except the source
      // This way we only remove the specific relationship, not all relationships
      
      // If there were no manual relationships before, we need to explicitly exclude just this one
      // by creating a manual list that includes all other auto-calculated relationships except the target
      if (sourceManualRelated.length === 0 && sourceAutoRelated.length > 1) {
        // Include all auto relationships except the target
        newSourceRelatedConcepts = sourceAutoRelated
          .filter((rel: any) => rel.id !== targetConceptId)
          .map((rel: any) => ({ id: rel.id, title: rel.title }));
      }
      
      if (targetManualRelated.length === 0 && targetAutoRelated.length > 1) {
        // Include all auto relationships except the source
        newTargetRelatedConcepts = targetAutoRelated
          .filter((rel: any) => rel.id !== sourceConceptId)
          .map((rel: any) => ({ id: rel.id, title: rel.title }));
      }
    }
    
    console.log("Final source related concepts to save:", newSourceRelatedConcepts);
    console.log("Final target related concepts to save:", newTargetRelatedConcepts);
    
    // Update source concept
    const sourceUpdateResponse = await fetch(`/api/concepts/${sourceConceptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        relatedConcepts: newSourceRelatedConcepts
      })
    });
    
    console.log("Source update response status:", sourceUpdateResponse.status);
    
    if (!sourceUpdateResponse.ok) {
      const errorText = await sourceUpdateResponse.text();
      console.error("Source update error:", errorText);
      throw new Error(`Failed to update source concept: ${errorText}`);
    }
    
    const sourceUpdateResult = await sourceUpdateResponse.json();
    console.log("Source update result:", sourceUpdateResult);
    
    // Update target concept
    const targetUpdateResponse = await fetch(`/api/concepts/${targetConceptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        relatedConcepts: newTargetRelatedConcepts
      })
    });
    
    console.log("Target update response status:", targetUpdateResponse.status);
    
    if (!targetUpdateResponse.ok) {
      const errorText = await targetUpdateResponse.text();
      console.error("Target update error:", errorText);
      throw new Error(`Failed to update target concept: ${errorText}`);
    }
    
    const targetUpdateResult = await targetUpdateResponse.json();
    console.log("Target update result:", targetUpdateResult);
    
    // Verify the updates by fetching fresh data
    const [verifySourceResponse, verifyTargetResponse] = await Promise.all([
      fetch(`/api/concepts/${sourceConceptId}`),
      fetch(`/api/concepts/${targetConceptId}`)
    ]);
    
    if (verifySourceResponse.ok && verifyTargetResponse.ok) {
      const verifySource = await verifySourceResponse.json();
      const verifyTarget = await verifyTargetResponse.json();
      
      console.log("Verified source concept after update:", verifySource);
      console.log("Verified target concept after update:", verifyTarget);
      
      console.log("Successfully disconnected concepts");
    }
  } catch (error) {
    console.error('Error disconnecting concepts:', error);
    throw error;
  }
} 