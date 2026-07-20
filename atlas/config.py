import os
from dotenv import load_dotenv
from smolagents import InferenceClientModel

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
model = InferenceClientModel(
    model_id="Qwen/Qwen2.5-Coder-32B-Instruct",
    token=HF_TOKEN,
)