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
)