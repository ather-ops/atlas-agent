from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

from schemas import ChatRequest, ChatResponse

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files from frontend directory
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
def home():
    return FileResponse("frontend/index.html")

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        print(f"Received message: {request.message}")
        answer = agent.run(request.message)
        print(f"Response: {answer}")
        return ChatResponse(response=str(answer))
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(f"❌ {error_msg}")
        return ChatResponse(response=error_msg)

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)