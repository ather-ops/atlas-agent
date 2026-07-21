import os
from dotenv import load_dotenv
from smolagents import InferenceClientModel

load_dotenv()

GROQ_TOKEN = os.getenv("GROQ_TOKEN")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
model = InferenceClientModel(
    model_id="llama-3.3-70b-versatile",
    token=GROQ_TOKEN,
)