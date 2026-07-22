from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

from schemas import ChatRequest, ChatResponse

# Load environment variables
load_dotenv()

# Try to import agent, but use mock if it fails
try:
    from atlas.agent import agent
    print("Atlas Agent imported successfully")
except ImportError as e:
    print(f"Could not import Atlas Agent: {e}")
    print("Using mock agent for testing...")
    
    class MockAgent:
        def run(self, message):
            return f"Atlas Agent (mock): Received '{message}'. Your backend is working!"
    
    agent = MockAgent()

app = FastAPI(
    title="Atlas Agent API",
    description="Backend API for Atlas Agent",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files from frontend directory
if os.path.exists("frontend"):
    app.mount("/static", StaticFiles(directory="frontend"), name="static")
else:
    print("Warning: frontend directory not found")

@app.get("/")
def home():
    if os.path.exists("frontend/index.html"):
        return FileResponse("frontend/index.html")
    else:
        return {"error": "index.html not found"}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        print(f"Received message: {request.message}")
        answer = agent.run(request.message)
        
        # Clean the response - extract just the answer
        response_text = str(answer)
        
        # If answer has attributes, try to get the content
        if hasattr(answer, 'content'):
            response_text = str(answer.content)
        elif hasattr(answer, 'answer'):
            response_text = str(answer.answer)
        elif hasattr(answer, 'result'):
            response_text = str(answer.result)
        
        print(f"Response: {response_text}")
        return ChatResponse(response=response_text)
        
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(f"Error: {error_msg}")
        return ChatResponse(response=error_msg)

@app.get("/health")
def health():
    return {"status": "healthy", "agent_loaded": agent is not None}

@app.get("/test")
def test():
    return {"message": "Backend is working!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)