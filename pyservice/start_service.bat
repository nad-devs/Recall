@echo off
echo Starting Conversation Analysis Service...

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Starting service...
echo Enter your OpenAI API key (or press enter to use environment variable or code default):
set /p API_KEY=

if not "%API_KEY%"=="" (
    echo Using provided API key...
    set OPENAI_API_KEY=%API_KEY%
)

echo Starting FastAPI server on port 8000...
uvicorn memory_service:app --reload --port 8000

pause 