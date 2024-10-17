#!/bin/bash

# Define the CSV file
CSV_FILE="./src/data/testingData.csv"

# Define a timeout for each k6 test (in seconds)
TIMEOUT=600

IFS=';'

# Function to execute k6 and handle errors
run_k6_test() {
  local endpoint=$1
  local test_type=$2
  local rest_type=$3
  local params=$4
  echo "Running test for endpoint: $endpoint"
  
  # Execute the k6 test in the background
  k6 run --env ENDPOINT="$endpoint" --env TEST_TYPE="$test_type" --env REST_TYPE="$rest_type" --env PARAMS=$params --env RESULTS_PATH="./src/results/api/${endpoint}_${test_type}.html" ./dist/script.test.js &
  local K6_PID=$!

  # Wait for k6 to finish or timeout
  local counter=0
  while kill -0 $K6_PID 2>/dev/null; do
    if [ $counter -ge $TIMEOUT ]; then
      echo "K6 test timed out for endpoint: $endpoint"
      kill -9 $K6_PID
      wait $K6_PID 2>/dev/null
      return 124
    fi
    sleep 1
    ((counter++))
  done

  # Get the exit status of the k6 process
  wait $K6_PID
  local EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ]; then
    echo "K6 test completed successfully for endpoint: $endpoint"
  else
    echo "K6 test failed for endpoint: $endpoint with exit code $EXIT_CODE"
  fi

  return $EXIT_CODE
}

# Initialize an array to hold the rows
csv_data=()

# Read the CSV file (skipping the header) and store each line in the array
while IFS=';' read -r endpoint restType params; do
  csv_data+=("$endpoint;$restType;$params")
done < <(tail -n +2 "$CSV_FILE")

total_rows=${#csv_data[@]}

# Start logging metrics in the background
./src/utils/graphing/log_metrics.sh & LOG_METRICS_PID=$!

sleep 2

# Loop through each row in the array
for ((i=0; i<total_rows; i++)); do
  # Split the row into endpoint, restType, and params
  IFS=';' read -r endpoint restType params <<< "${csv_data[$i]}"
  
  # Check if the row is empty (skip empty lines)
  if [[ -z "$endpoint" ]] && [[ -z "$restType" ]] && [[ -z "$params" ]]; then
    echo "Empty row detected, skipping."
    continue
  fi

  # Increment row counter
  ((row_count++))
  
  npm run bundle

  echo "Processing row $row_count: endpoint=$endpoint, restType=$restType, params=$params"
  
  # Run RPS test
  run_k6_test "$endpoint" "rps" "$restType" "$params"
    
  # Run breakdown test
  run_k6_test "$endpoint" "breakdown" "$restType" "$params"
  
  echo "-----------------------------------"
  
  # Add a 2-minute delay before the next iteration, except for the last row
  if [[ $i -lt $((total_rows - 1)) ]]; then
    echo "Letting system cooldown... Waiting for 2 minutes before the next test..."
    sleep 120
  fi
done

# Terminate the log_metrics.sh process
kill "$LOG_METRICS_PID" 2>/dev/null

# Wait for the log_metrics.sh process to terminate
wait "$LOG_METRICS_PID" 2>/dev/null

echo "All tests completed."

echo "Creating graphical output for CPU processes"

ts-node src/utils/graphing/logToGraph.ts