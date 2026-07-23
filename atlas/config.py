import os

from dotenv import load_dotenv
from smolagents import OpenAIServerModel

load_dotenv()

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Validate environment
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env")

# Atlas LLM
model = OpenAIServerModel(
    model_id="llama-3.3-70b-versatile",
    api_key=GROQ_API_KEY,
    api_base="https://api.groq.com/openai/v1",
)