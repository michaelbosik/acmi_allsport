# Written by Michael Bosik, 2026
#
# This script uses SSH to connect to a Raspberry Pi running the score_board.py script, 
# reads the output, parses it, and sends the data to a Singular Live Data Stream Manager (DSM) for use in live broadcasts.
# To run this script, use `python3 score_board.py` in the terminal.

import subprocess
import re
import paramiko
import socket
import time
import json
from paramiko import channel
import requests

MAC_PREFIXES = ["b8:27:eb", "dc:a6:32"]
USERNAME = "acmi"
PASSWORD = "acmi"
# REMOTE_SCRIPT = "/home/acmi/Desktop/serial_reader.py"

# When testing locally, set REMOTE_SCRIPT to the path of serial_reader.py on your local machine.
REMOTE_SCRIPT = "~/Desktop/serial_reader.py"

DATA_STREAM_URL = "https://datastream.singular.live/datastreams/"
DATA_STREAM_PRIVATE_TOKEN = "7mEnVZu4rHlnUVJW2la78d"

# Only have basketball and hockey set up for parsing currently, but can add more sports as needed. 
# The parsing logic may need to be adjusted based on the actual serial output format from the AllSport 5000 for each sport.
SPORT_OPTIONS = {
    "1": "basketball",
    "2": "hockey",
    # "3": "football",
    # "4": "soccer",
    # "5": "baseball",
    # "6": "volleyball",
    # "7": "swimming",
    # "8": "wrestling",
    # "9": "tennis"
}

# Define the parsing indexes for each field based on the expected serial data format for each sport.
# This may need to change depending on AllSport 5000 serial output formatting
PARSING_INDEXES = {
    "basketball": {
        "minutes": (0, 2),
        "seconds": (3, 5),
        "timer_stopped": (7, 8),
        "home_score": (13, 15),
        "away_score": (16, 18),
        "home_fouls": (18, 20),
        "away_fouls": (20, 22),
        "period": (28, 29)
    },
    "hockey": {
        "minutes": (0, 2),
        "seconds": (3, 5),
        "timer_stopped": (7, 8),
        "home_score": (8, 10),
        "away_score": (10, 12),
        "home_fouls": (14, 16),
        "away_fouls": (16, 18),
        "period": (18, 19)
    }
    # Add parsing indexes for other sports here
}

# Function to pretty print the score data in a readable format for the console
def pretty_print_score(score_data: dict, selected_sport: str):
    minutes = score_data.get("minutes", 0)
    seconds = score_data.get("seconds", 0)
    stopped = score_data.get("timer_stopped", False)

    home_score = score_data.get("home_score", 0)
    away_score = score_data.get("away_score", 0)

    home_fouls = score_data.get("home_fouls", 0)
    away_fouls = score_data.get("away_fouls", 0)

    period = score_data.get("period", 0)

    timer_status = "STOPPED" if stopped else "RUNNING"

    print("\n" + "=" * 50)
    print(f"            {selected_sport.upper()} LIVE DATA")
    print("=" * 50)

    print(f"   TIME:   {minutes:02d}:{seconds:02d}   ({timer_status})")
    print("-" * 50)

    print(f"   HOME:   {home_score:>3}    Fouls: {home_fouls:>2}")
    print(f"   AWAY:   {away_score:>3}    Fouls: {away_fouls:>2}")

    print("-" * 50)
    print(f"   PERIOD: {period}")
    print("=" * 50 + "\n")

# Function to parse a line of serial data based on the expected format for the selected sport and update the scoreData dictionary accordingly
def parse_line(selected_sport, line, scoreData):

    print(f"Raw line: '{line}'")

    line = line.strip("b'").strip("'")
    line = re.sub(r"[\x00-\x1F\x7F]", "", line)
    line = line.rstrip("\n")

    indexes = PARSING_INDEXES[selected_sport]

    if len(line) < 26:
        print(f"Line length: {len(line)}. Expected at least {max(end for _, end in indexes.values())} characters.")
        return scoreData

    try:
        for field, (start, end) in indexes.items():
            raw_value = line[start:end].strip()
            print(f"Extracted raw value for {field}: '{raw_value}'")

            if field == "timer_stopped":
                scoreData[field] = (raw_value == "s")
            elif raw_value:
                scoreData[field] = int(raw_value)
            else:
                scoreData[field] = 0
    except Exception as e:  
        print(f"Error parsing line: {e}. Line content: '{line}'")

    pretty_print_score(scoreData, selected_sport)

    return scoreData

# Function to scan the local network for devices with specified MAC address prefixes and return their IP addresses
def get_ip_from_mac(mac_prefixes):
    print("Scanning network for devices with MAC prefixes:", mac_prefixes)
    result = subprocess.run(
        ["arp", "-a"],
        capture_output=True,
        text=True
    )

    output = result.stdout.lower()
    ips = []

    for line in output.splitlines():
        for prefix in mac_prefixes:
            if prefix in line:
                match = re.search(r"\((.*?)\)", line)
                if match:
                    ips.append(match.group(1))

    if ips:
        print(f"Found device(s) at {ips}")
        return ips

    print("No devices found with specified MAC prefixes.")
    return None

# Function to attempt SSH connection to each IP address and return the first successful connection along with the working IP
def find_working_pi(ip_list, username, password):
    for ip in ip_list:
        print(f"Trying connection to {username}@{ip}...")

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        try:
            client.connect(
                ip,
                username=username,
                password=password,
                timeout=3
            )

            print(f"Connected successfully to {ip}")
            return client

        except paramiko.AuthenticationException:
            print(f"Authentication failed on {ip}")
        except (socket.timeout, paramiko.SSHException, OSError):
            print(f"Connection failed on {ip}")
        finally:
            # If connection failed, make sure we close
            if not client.get_transport() or not client.get_transport().is_active():
                client.close()

    return None

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

# Function to execute the remote score_board.py script and continuously read and parse its output, sending updates to Singular Live DSM
def stream_remote_script(client, selected_sport):
    
    transport = client.get_transport()

    try:
        print(f"Starting remote script at path {REMOTE_SCRIPT}...")
        channel = transport.open_session()
        channel.get_pty()
        channel.exec_command(f"python3 -u {REMOTE_SCRIPT}")
    except Exception as e:
        print(f"Failed to execute remote script: {e}")
        return

    scoreData = {
        "minutes": 0,
        "seconds": 0,
        "timer_stopped": False,
        "home_score": 0,
        "away_score": 0,
        "home_fouls": 0,
        "away_fouls": 0,
        "period": 1
    }

    try:
        while True:
            if channel.recv_ready():
                chunk = channel.recv(1024).decode("utf-8", errors="ignore")
                send_to_singular(parse_line(selected_sport, chunk, scoreData))

            if channel.recv_stderr_ready():
                error = channel.recv_stderr(1024).decode("utf-8", errors="ignore")
                print(error, end="")

            if channel.exit_status_ready():
                break

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\nStopping remote script...")
        channel.send("\x03")  # Send Ctrl+C to stop the script
        channel.close()

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

# Main function to orchestrate the connection, data streaming, parsing, and sending to Singular Live DSM
def main():

    selected_sport = pretty_select_sport(SPORT_OPTIONS)

    ips = None
    tries = 0
    while not ips and tries < 3:
        ips = get_ip_from_mac(MAC_PREFIXES)
        tries += 1

    if not ips:
        print("Could not find any devices on the network with specified MAC prefixes. Exiting.")
        return

    client = None
    tries = 0
    while not client and tries < 3:
        client = find_working_pi(ips, USERNAME, PASSWORD)
        tries += 1

    if not client:
        print("Could not connect to any device with provided credentials. Exiting.")
        return

    stream_remote_script(client, selected_sport)

    client.close()
    print("Connection closed. Exiting.")

# For testing purposes, you can call parse_line directly with a sample input line
# def main():
#     scoreData = {
#         "minutes": 0,
#         "seconds": 0,
#         "timer_stopped": False,
#         "home_score": 0,
#         "away_score": 0,
#         "home_fouls": 0,
#         "away_fouls": 0,
#         "period": 1
#     }
#     line = "b'\x01 7:34         2  4 1 1      3     F2\x04'"
#     line = line.strip("b'").strip("'")
#     selected_sport = pretty_select_sport(SPORT_OPTIONS)
#     scoreData = parse_line(selected_sport, line, scoreData)
#     pretty_print_score(scoreData, selected_sport)

if __name__ == "__main__":
    main()

