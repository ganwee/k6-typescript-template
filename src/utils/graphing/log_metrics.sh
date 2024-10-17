#!/bin/bash

# Output file
output_file="./src/results/system/output.log"

# Clear the output file if it exists
# > "$output_file"

echo "Timestamp           | Command   | CPU% | MEM%   | RSS" >> "$output_file"

timeout_duration=3600  # 1 hour
start_time=$(date +%s) 

# Run the loop to capture metrics
while true; do
    current_time=$(date +%s)
    elapsed_time=$((current_time - start_time))
    
    if [ "$elapsed_time" -ge "$timeout_duration" ]; then
        echo "Timeout reached. Exiting the loop."
        break  # Exit the loop if the timeout duration is reached
    fi

    current_time=$(date +"%Y-%m-%d %H:%M:%S")

    if [ "$elapsed_time" -ge "$timeout_duration" ]; then
        echo "Timeout reached. Exiting the loop."
        break  # Exit the loop if the timeout duration is reached
    fi

    # Get the metrics of k6 and node processes and append to the output file
    ps -eo comm,%cpu,%mem,rss | grep -E "k6|node" | awk -v time="$current_time" '{printf "%-20s| %-10s| %-5s| %-7s| %.2f\n", time, $1, $2, $3, $4/1024}' >> "$output_file"
    
    # Sleep for 1 second
    sleep 1
done
