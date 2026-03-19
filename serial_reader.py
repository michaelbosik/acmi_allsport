# Written by Michael Bosik, 2026
#
# This script connects to a serial port and continuously reads data from it, printing the output to the console.
# It handles serial connection errors and attempts to reconnect if the connection is lost.
# To run this script, use `python3 serial_reader.py` in the terminal. 

import requests
import serial
import time

# SERIAL_PORT is defined depending on the operating system. For Linux, it is usually /dev/ttyUSB0 or /dev/ttyACM0. 
# For macOS, it is usually /dev/tty.usbserial-XXXX or /dev/tty.usbmodemXXXX.
# You can use `ls /dev/tty.*` in the terminal to find the correct port.

SERIAL_PORT = '/dev/ttyUSB0'

DATA_STREAM_URL = "https://datastream.singular.live/datastreams/"
DATA_STREAM_PRIVATE_TOKEN = "7mEnVZu4rHlnUVJW2la78d"

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


# Try to connect to the serial port and read data
def open_serial():
  while True:
    try:
      print(f"Trying to connect to serial port {SERIAL_PORT}...", flush=True)
      ser = serial.Serial(SERIAL_PORT, 9600, timeout=0)
      print("Serial connected", flush=True)
      return ser
    except serial.SerialException:
      print("Waiting for serial device...", flush=True)
      time.sleep(2)

def main():

  ser = open_serial()

  while True:
    try:
      parsed_data = ser.readline().decode('utf-8', errors='ignore').strip()
      if parsed_data:
        send_to_singular(parsed_data)
        print(parsed_data, flush=True)
      time.sleep(1)
    except serial.SerialException as e:
      print(f"Serial exception: {e}. Reconnecting...", flush=True)
      ser.close()
      time.sleep(2)
      ser = open_serial()
    except Exception as e:
      print(f"Unexpected error: {e}", flush=True)
      time.sleep(1)

if __name__ == "__main__":
  main()

