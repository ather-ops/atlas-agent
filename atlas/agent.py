from smolagents import CodeAgent
from atlas.config import model
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
    add_base_tools=False,
    instructions="""
You are Atlas, an autonomous AI assistant.

Always think before acting.
Use tools whenever needed.
If a tool can answer the user's question, use it instead of guessing.
Keep answers concise and accurate.
Never invent information.
"""
)