# Written by Michael Bosik, 2026
#
# This script connects to a serial port and continuously reads data from it, printing the output to the console.
# It handles serial connection errors and attempts to reconnect if the connection is lost.
# To run this script, use `python3 serial_reader.py` in the terminal. 

import serial
import time

# SERIAL_PORT is defined depending on the operating system. For Linux, it is usually /dev/ttyUSB0 or /dev/ttyACM0. 
# For macOS, it is usually /dev/tty.usbserial-XXXX or /dev/tty.usbmodemXXXX.
# You can use `ls /dev/tty.*` in the terminal to find the correct port.

# SERIAL_PORT = '/dev/ttyUSB0'
SERIAL_PORT = '/dev/tty.usbserial-11230'

BAUD_RATE = 9600
TIMEOUT = 0

# Try to connect to the serial port and read data
def open_serial():
  while True:
    try:
      print(f"Trying to connect to serial port {SERIAL_PORT}...", flush=True)
      ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=TIMEOUT)
      print("Serial connected", flush=True)
      return ser
    except serial.SerialException:
      print("Waiting for serial device...", flush=True)
      time.sleep(2)

def main():
  ser = open_serial()
  while True:
    try:
      print("", flush=True)
      raw = ser.readline() # Read a line of data from the serial port
      raw = raw.decode('utf-8', errors='replace').strip() # Decode bytes to string and remove whitespace
      print(raw, end="") # Print the raw data
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

