from smolagents import CodeAgent, OpenAIServerModel
from atlas.config import GROQ_TOKEN
model = OpenAIServerModel(
    model_id="llama-3.3-70b-versatile",
    api_key=GROQ_TOKEN,
    api_base="https://api.groq.com/openai/v1",
)
from atlas.tools import (
    get_current_datetime,
    get_system_info,
    get_weather,
    simple_calculator,
    read_file,
    write_file,
    web_search,
    execute_code,
)

tools = [
    get_current_datetime,
    get_system_info,
    get_weather,
    simple_calculator,
    read_file,
    write_file,
    web_search,
    execute_code,
]

agent = CodeAgent(
    tools=tools,
    model=model,
)