# Written by Michael Bosik, 2026
#
# This script uses SSH to connect to a Raspberry Pi running the score_board.py script, 
# reads the output, parses it, and sends the data to a Singular Live Data Stream Manager (DSM) for use in live broadcasts.
# To run this script, use `python3 score_board.py` in the terminal.

import subprocess
import re
import requests

LOCAL_SCRIPT = "./serial_reader.py"

DATA_STREAM_URL = "https://datastream.singular.live/datastreams/"
DATA_STREAM_PRIVATE_TOKEN = "7mEnVZu4rHlnUVJW2la78d"

# SPORT_OPTIONS = {
#     "1": "basketball",
#     "2": "hockey",
#     # "3": "football",
#     # "4": "soccer",
#     # "5": "baseball",
#     # "6": "volleyball",
#     # "7": "swimming",
#     # "8": "wrestling",
#     # "9": "tennis"
# }

# Define the parsing indexes for each field based on the expected serial data format for each sport.

#  0:00.0s 2 3   1 42    2:00          2:00       AF
PARSING_INDEXES_CG = {
    "basketball": {
        "minutes": (0, 2),
        "seconds": (3, 5),
        "timer_stopped": (7, 8),
        "score_home": (13, 15),
        "score_away": (16, 18),
        "fouls_home": (18, 20),
        "fouls_away": (20, 22),
        "game_period": (28, 29)
    },
    "hockey": {
        "minutes": (0, 2),
        "seconds": (3, 5),
        "timer_stopped": (7, 8),
        "score_home": (8, 10),
        "score_away": (10, 12),
        "fouls_home": (14, 16),
        "fouls_away": (16, 18),
        "game_period": (18, 19)
    }
    # Add parsing indexes for other sports here
}

PARSING_INDEXES_5000 = {
    "basketball": {
        "minutes": (0, 2),
        "seconds": (3, 5),
        "timer_stopped": (7, 8),
        "score_home": (13, 15),
        "score_away": (16, 18),
        "fouls_home": (18, 20),
        "fouls_away": (20, 22),
        "game_period": (28, 29)
    },
    "hockey": {
        "minutes": (0, 2),
        "seconds": (3, 5),
        "milliseconds": (6, 7),
        "timer_stopped": (7, 8),
        "score_home": (8, 10),
        "score_away": (10, 12),
        "fouls_home": (14, 16),
        "fouls_home": (16, 18),
        "game_period": (18, 19),
        "home_penalty_minutes": (22, 24),
        "home_penalty_seconds": (25, 27),
        "away_penalty_minutes": (36, 38),
        "away_penalty_seconds": (39, 41)
    }
    # Add parsing indexes for other sports here
}

# Function to pretty print the score data in a readable format for the console
def pretty_print_score(score_data: dict, selected_sport: str):
    minutes = score_data.get("minutes", 0)
    seconds = score_data.get("seconds", 0)
    stopped = score_data.get("timer_stopped", False)

    score_home = score_data.get("score_home", 0)
    score_away = score_data.get("score_away", 0)

    fouls_home = score_data.get("fouls_home", 0)
    fouls_home = score_data.get("fouls_home", 0)

    game_period = score_data.get("game_period", 0)

    home_penalty_minutes = score_data.get("home_penalty_minutes", 0)
    home_penalty_seconds = score_data.get("home_penalty_seconds", 0)
    away_penalty_minutes = score_data.get("away_penalty_minutes", 0)
    away_penalty_seconds = score_data.get("away_penalty_seconds", 0)

    timer_status = "STOPPED" if stopped else "RUNNING"

    print("\n" + "=" * 50)
    print(f"            {selected_sport.upper()} LIVE DATA")
    print("=" * 50)

    print(f"   TIME:   {minutes:02d}:{seconds:02d}   ({timer_status})")
    print("-" * 50)

    print(f"   HOME:   {score_home:>3}    Shots: {fouls_home:>2}")
    print(f"   AWAY:   {score_away:>3}    Shots: {fouls_home:>2}")
    print(f"   HPEN:   {home_penalty_minutes:02d}:{home_penalty_seconds:02d}   ({timer_status})")
    print(f"   APEN:   {away_penalty_minutes:02d}:{away_penalty_seconds:02d}   ({timer_status})")

    print("-" * 50)
    print(f"   PERIOD: {game_period}")
    print("=" * 50 + "\n")

# Function to display a menu for selecting the sport to listen for and return the selected sport
def pretty_select_sport(sports: dict) -> str:
    sport_values = list(sports.values())

    print("\n" + "=" * 40)
    print("      SELECT SPORT TO LISTEN FOR")
    print("=" * 40)

    for i, sport in enumerate(sport_values, start=1):
        print(f"  {i:>2}. {sport.capitalize()}")

    print("=" * 40)

    while True:
        choice = input("Enter number: ").strip()

        if choice.isdigit():
            index = int(choice) - 1
            if 0 <= index < len(sport_values):
                selected = sport_values[index]
                print(f"\nListening for {selected.capitalize()} data...\n")
                return selected

        print("Invalid selection. Please try again.\n")

# Function to send parsed data to Singular Live DSM using the Data Stream API
def send_to_singular(parsed_data):
    headers = {
        "Authorization": f"Bearer {DATA_STREAM_PRIVATE_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.put(DATA_STREAM_URL+DATA_STREAM_PRIVATE_TOKEN, headers=headers, json=parsed_data)
    if response.status_code != 200:
        print(f"Failed to send data to Singular Live DSM: {response.status_code}")
        return
    print(f"Data sent to Singular Live DSM successfully. Status code: {response.status_code}")

# Function to parse a line of serial data based on the expected format for the selected sport and update the scoreData dictionary accordingly
# def parse_line(selected_sport, line, scoreData):
#     # print(f"Raw line: '{line}'")

#     line = line.strip("b'").strip("'")
#     line = re.sub(r"[\x00-\x1F\x7F]", "", line)
#     line = line.rstrip("\n")

#     indexes = PARSING_INDEXES_5000[selected_sport]
#     # indexes = PARSING_INDEXES_CG[selected_sport]

#     parsed_data = {}

#     if len(line) < 26:
#         # print(f"Line length: {len(line)}. Expected at least {max(end for _, end in indexes.values())} characters.")
#         return scoreData

#     try:
#         for field, (start, end) in indexes.items():
#             raw_value = line[start:end].strip()
#             # print(f"Extracted raw value for {field}: '{raw_value}'")

#             if field == "timer_stopped":
#                 parsed_data[field] = (raw_value == "s")
#             elif raw_value:
#                 parsed_data[field] = int(raw_value)
#             else:
#                 parsed_data[field] = 0
#     except Exception as e:  
#         print(f"Error parsing line: {e}. Line content: '{line}'")

#     return parsed_data

def local_read(selected_sport):
    scoreData = {
        "minutes": 0,
        "seconds": 0,
        "milliseconds": 0,
        "timer_stopped": True,
        "score_home": 0,
        "score_away": 0,
        "fouls_home": 0,
        "fouls_home": 0,
        "game_period": 1,
        "home_penalty_minutes": 0,
        "home_penalty_seconds": 0,
        "away_penalty_minutes": 0,
        "away_penalty_seconds": 0
    }

    process = subprocess.Popen(
        ["python3", "-u", LOCAL_SCRIPT],
        stdout=subprocess.PIPE,
        text=True,
        bufsize=1
    )

    try:
        while True:
            line = process.stdout.readline().strip()
            if not line:
                break
            print(line, end="")
            parsed_data = parse_line(selected_sport, line, scoreData)
            update_needed = False
            for k, v in parsed_data.items():
                if scoreData.get(k) != v:
                    scoreData[k] = v
                    update_needed = True
            if update_needed:
                pretty_print_score(scoreData, selected_sport)
                send_to_singular(parsed_data)

    except KeyboardInterrupt:
        print("\nStopping serial read script...")

def main():
    # selected_sport = pretty_select_sport(SPORT_OPTIONS)
    selected_sport = "hockey"  # Default sport for testing
    local_read(selected_sport)

if __name__ == "__main__":
    main()

