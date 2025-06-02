# This file imports and runs the FastAPI app from api/v1/extract-concepts.py
# This is the main entry point for the Render deployment

import os
import uvicorn
from api.v1.extract_concepts import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "api.v1.extract_concepts:app",
        host="0.0.0.0", 
        port=port,
        reload=False
    ) 