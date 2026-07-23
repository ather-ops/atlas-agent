from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from atlas.agent import agent
from schemas import ChatRequest, ChatResponse

app = FastAPI(
    title="Atlas Agent API",
    description="Autonomous AI Assistant Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your domain after deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
async def home():
    return FileResponse("frontend/index.html")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    print(f"\nUser: {request.message}")

    try:
        result = agent.run(request.message)

        print(f"Atlas: {result}")

        return ChatResponse(
            response=str(result)
        )

    except Exception as e:
        print(f"\nERROR:\n{e}")

        return ChatResponse(
            response=f"Error: {str(e)}"
        )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "agent": "online"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )