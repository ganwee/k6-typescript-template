import fs from "fs";
import { createCanvas, Canvas } from "canvas";
import { ChartConfiguration, Chart, registerables } from "chart.js";

// Register Chart.js components
Chart.register(...registerables);

interface LogEntry {
  timestamp: string;
  command: string;
  cpu: number;
  mem: number;
  rss: number;
}

// Function to parse the log file
function parseLogFile(filePath: string): LogEntry[] {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").slice(1); // Skip header

  return lines.map((line) => {
    const [timestamp, command, cpu, mem, rss] = line
      .split("|")
      .map((part) => part.trim());

    return {
      timestamp,
      command,
      cpu: parseFloat(cpu),
      mem: parseFloat(mem),
      rss: parseFloat(rss),
    };
  });
}

// Function to create and save the chart
async function createChart(data: LogEntry[]): Promise<void> {
  const width = 1280;
  const height = 720;
  const canvas: Canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const allTimestamps = Array.from(new Set(data.map((row) => row.timestamp)));

  // Separate data by command
  const nodeData = data.filter((entry) => entry.command === "node");
  const paddedNodeData = padData(nodeData, allTimestamps, "node");
  
  const k6Data = data.filter((entry) => entry.command === "k6");
  const paddedK6Data = padData(k6Data, allTimestamps, "k6");

  const chartConfig: ChartConfiguration = {
    type: "line",
    data: {
      labels: allTimestamps,
      datasets: [
        {
          label: "Node CPU%",
          borderWidth: 1,
                pointRadius: 0,
          data: paddedNodeData.map((row) => row.cpu),
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
          yAxisID: "y1"
        },
        {
          label: "Node MEM",
          borderWidth: 1,
                pointRadius: 0,
          data: paddedNodeData.map((row) => row.mem),
          borderColor: "rgb(255, 99, 132)",
          tension: 0.1,
          yAxisID: "y1"
        },
        {
          label: "Node RSS",
          borderWidth: 1,
                pointRadius: 0,
          data: paddedNodeData.map((row) => row.rss),
          borderColor: "rgb(153, 102, 255)",
          tension: 0.1,
          yAxisID: "y2"
        },
        {
          label: "k6 CPU%",
          borderWidth: 1,
                pointRadius: 0,
          data: paddedK6Data.map((row) => row.cpu),
          borderColor: "rgb(54, 162, 235)",
          tension: 0.1,
          yAxisID: "y1"
        },
        {
          label: "k6 MEM",
          borderWidth: 1,
                pointRadius: 0,
          data: paddedK6Data.map((row) => row.mem),
          borderColor: "rgb(255, 206, 86)",
          tension: 0.1,
          yAxisID: "y1"
        },
        {
          label: "k6 RSS",
          borderWidth: 1,
                pointRadius: 0,
          data: paddedK6Data.map((row) => row.rss),
          borderColor: "rgb(233, 255, 151)",
          tension: 0.1,
          yAxisID: "y2"
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "CPU and Memory Usage Over Time (Node vs k6)",
        },
        legend: {
          display: true,
          position: "top",
          labels: {
            boxHeight: 0
          }
        },
      },
      scales: {
        x: {
          type: "category",
          title: {
            display: true,
            text: "Timestamp",
          },
        },
        y1: {
          beginAtZero: true,
          position: "left",
          title: {
            display: true,
            text: "Usage (%)",
          },
        },
        y2: {
          beginAtZero: true,
          position: "right",
          title: {
            display: true,
            text: "Usage (MB)",
          },
        },
      },
    },
  };

  // Create chart using node-canvas-compatible approach
  new Chart(ctx as unknown as HTMLCanvasElement, chartConfig);

  try {
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./src/results/system/output_graph.png", buffer);
    console.log("Graph saved as output_graph.png");
  } catch (error) {
    console.error("Error saving the graph:", error);
  }
}

function padData(
  commandData: LogEntry[],
  allTimestamps: string[],
  command: "k6" | "node"
) {
  const paddedData = allTimestamps.map((timestamp) => {
    const existingData = commandData.find((d) => d.timestamp === timestamp);
    return existingData
      ? existingData
      : {
          timestamp,
          command,
          cpu: 0.0,
          mem: 0.0,
          rss: 0.0,
        };
  });
  return paddedData;
}

// Main function
async function main(): Promise<void> {
  const data = parseLogFile("./src/results/system/output.log");
  await createChart(data);
}

main().catch(console.error);
