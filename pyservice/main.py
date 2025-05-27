# This file imports and runs the FastAPI app from concept_extractor.py
# This is the main entry point for the Render deployment

import os
import uvicorn
from concept_extractor import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "concept_extractor:app",
        host="0.0.0.0", 
        port=port,
        reload=False
    ) 