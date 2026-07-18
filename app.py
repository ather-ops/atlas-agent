from atlas.tools import get_current_datetime
print(get_current_datetime())

from atlas.tools import get_system_info
print(get_system_info())

from atlas.tools import get_weather
print(get_weather("Bangalore"))
print(get_weather("Srinagar"))

from atlas.tools import simple_calculator
print(simple_calculator("2 + 3 * 4"))
print(simple_calculator("10 / 2 - 1"))

from atlas.tools import read_file
print(read_file("notes.txt"))
