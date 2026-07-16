import os

from dotenv import load_dotenv
from smolagents import InferenceClientModel

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

model = InferenceClientModel(
    model_id="Qwen/Qwen2.5-Coder-32B-Instruct",
    token=HF_TOKEN,
)

print("Done, Atlas is on the way")