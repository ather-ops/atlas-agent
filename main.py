from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from atlas.agent import agent
from schemas import ChatRequest, ChatResponse

app = FastAPI(
    title="Atlas Agent API",
    description="Backend API for Atlas Agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Change after deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
def home():
    return FileResponse("frontend/index.html")


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        answer = agent.run(request.message)
        return ChatResponse(
            response=str(answer)
        )
    except Exception as e:
        return ChatResponse(
            response=f"Error: {str(e)}"
        )