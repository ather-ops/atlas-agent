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
# Toll 3: Wheather tool
import requests
from atlas.config import WEATHER_API_KEY


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
        "appid": WEATHER_API_KEY,
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