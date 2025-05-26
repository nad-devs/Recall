// Simulate concept discovery during analysis
export function createConceptDiscoverySimulator(
  setDiscoveredConcepts: (callback: (prev: string[]) => string[]) => void,
  setAnalysisStage: (stage: string) => void
) {
  return () => {
    setDiscoveredConcepts(() => [])
    setAnalysisStage("Parsing conversation...")
    
    const stages = [
      { stage: "Tokenizing text...", delay: 500 },
      { stage: "Identifying topics...", delay: 1000 },
      { stage: "Extracting concepts...", delay: 1500 },
      { stage: "Analyzing relationships...", delay: 2000 },
      { stage: "Generating summaries...", delay: 2500 },
      { stage: "Finalizing analysis...", delay: 3000 }
    ]
    
    const potentialConcepts = [
      "SQL Query Optimization",
      "Database Indexing", 
      "React Components",
      "API Design",
      "Machine Learning",
      "Data Structures",
      "Algorithm Analysis",
      "System Architecture",
      "Authentication",
      "Performance Tuning",
      "Error Handling",
      "Code Review",
      "Testing Strategies"
    ]
    
    const conceptsToShow = potentialConcepts
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 4) + 4)
    
    stages.forEach(({ stage, delay }) => {
      setTimeout(() => {
        setAnalysisStage(stage)
      }, delay)
    })
    
    conceptsToShow.forEach((concept, index) => {
      setTimeout(() => {
        setDiscoveredConcepts(prev => [...prev, concept])
      }, 1200 + index * 800)
    })
  }
} 