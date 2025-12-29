#!/bin/bash

# Kill background processes on exit
trap "kill 0" EXIT

echo "Starting OpenSeeFace Bridge..."
/opt/miniconda3/bin/python3 -u bridge/ws_bridge.py > bridge.log 2>&1 &
echo "Bridge started."

# Wait a bit for bridge to be ready
sleep 2

echo "Starting OpenSeeFace Tracker..."
# Using default camera (0)
/opt/miniconda3/bin/python3 -u OpenSeeFace/facetracker.py -c 0 --ip 127.0.0.1 --port 11573 --log-data tracker_data.log --discard-after 0 --scan-every 0 --no-3d-adapt 1 --max-feature-updates 900 > tracker.log 2>&1 &
echo "Tracker started."

echo "Starting Web Server..."
/opt/miniconda3/bin/python3 -u -m http.server 8000 > web.log 2>&1 &
echo "Web Server started."

echo "================================================="
echo "Access the web interface at: http://localhost:8000"
echo "================================================="

wait
