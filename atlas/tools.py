# Tool 1: Current Date and Time Tool
import datetime
from smolagents import tool

@tool
def get_current_datetime() -> str:
    """
    Returns the current local date and time.
    Args:
        None
    """
    current_time = datetime.datetime.now()
    formatted_time = current_time.strftime("%d-%m-%Y %H:%M:%S")
    return f"Current date and time: {formatted_time}"

# Tool 2: System Information Tool
import platform

@tool
def get_system_info() -> str:
    """
    Returns basic information about the current computer.
    Returns:
        A string containing operating system details.
    """
    return f"""
Operating System : {platform.system()}
OS Version       : {platform.version()}
Machine          : {platform.machine()}
Processor        : {platform.processor()}
Python Version   : {platform.python_version()}
"""
# Tool 3: Wheather tool
import requests
from atlas.config import OPENWEATHER_API_KEY


@tool
def get_weather(city: str) -> str:
    """
    Returns the current weather for a city.
    Args:
        city: Name of the city.
    """
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric"
    }
    response = requests.get(url, params=params)
    if response.status_code != 200:
        return f"""Status Code : {response.status_code}
        Response:{response.text}"""
    data = response.json()
    temperature = data["main"]["temp"]
    humidity = data["main"]["humidity"]
    condition = data["weather"][0]["description"]
    wind = data["wind"]["speed"]
    return f"""
Current weather in {city}
Temperature : {temperature}°C
Condition   : {condition.title()}
Humidity    : {humidity}%
Wind Speed  : {wind} m/s
"""
# Tool 4: Simple Calculator Tool
from smolagents import tool

@tool
def simple_calculator(expression: str) -> str:
    """
    Calculates a basic mathematical expression.
    Args:
        expression: A mathematical expression such as
        "2 + 3", "10 / 2", or "5 * 8".
    Returns:
        The calculated result or an error message.
    """
    allowed_chars = "0123456789+-*/(). %"
    if any(char not in allowed_chars for char in expression):
        return "Error: Only numbers and basic operators (+, -, *, /, %, ., parentheses) are allowed."

    try:
        result = eval(expression)
        return f"Result: {result}"
    except Exception as e:
        return f"Calculation Error: {e}"
    
# Tool 5: File Reader Tool
@tool
def read_file(filename: str) -> str:
    """
    Reads the content of a file and returns it as a string.
    Args:
        filename: The name of the file to read.
    Returns:
        The content of the file as a string.
    """
    try:
        with open(filename, "r") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {e}"

# Tool 6: File writer
@tool
def write_file(filename: str, content: str) -> str:
    """
    Writes content to a file.
    Args:
        filename: The name of the file to write to.
        content: The content to write to the file.
    Returns:
        A success message or an error message.
    """
    try:
        with open(filename, "w") as f:
            f.write(content)
        return f"Successfully wrote to {filename}"
    except Exception as e:
        return f"Error writing to file: {e}"

# Tool 7: Web search tool
from tavily import TavilyClient
from atlas.config import TAVILY_API_KEY

client = TavilyClient(api_key=TAVILY_API_KEY)
@tool
def web_search(query: str) -> str:
    """
    Searches the web and returns the most relevant results.
    Args:
        query: The search query.
    Returns:
        Search results including title, URL and summary.
    """
    try:
        response = client.search(
            query=query,
            search_depth="basic",
            max_results=5
        )
        results = response["results"]
        if not results:
            return "No search results found."
        output = ""
        for i, result in enumerate(results, start=1):
            output += (
                f"\nResult {i}\n"
                f"Title   : {result['title']}\n"
                f"URL     : {result['url']}\n"
                f"Content : {result['content']}\n"
                f"{'-'*50}\n"
            )
        return output
    except Exception as e:
        return f"Search Error: {e}"

# Tool 8: Code Executor Tool
import io
import contextlib

@tool
def execute_code(code: str) -> str:
    """
    Executes Python code and returns the output.
    Args:
        code: Python code to execute.
    Returns:
        Output of the executed code.
    """
    try:
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            exec(code)
        result = output.getvalue()
        if result.strip() == "":
            return "Code executed successfully."
        return result
    except Exception as e:
        return f"Execution Error: {e}"