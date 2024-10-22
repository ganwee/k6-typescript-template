import fs from "fs";
import { createCanvas, Canvas } from "canvas";
import { ChartConfiguration, Chart, registerables } from "chart.js";
import "chartjs-plugin-annotation";
import { AnnotationOptions } from "chartjs-plugin-annotation";

const endpoint: string = process.argv[2];

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
  const paddedNodeData = padData(nodeData, allTimestamps);

  const sections = defineSections(allTimestamps);

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
          yAxisID: "y1",
        },
        {
          label: "Node MEM",
          borderWidth: 1,
          pointRadius: 0,
          data: paddedNodeData.map((row) => row.mem),
          borderColor: "rgb(255, 99, 132)",
          tension: 0.1,
          yAxisID: "y1",
        },
        {
          label: "Node RSS",
          borderWidth: 1,
          pointRadius: 0,
          data: paddedNodeData.map((row) => row.rss),
          borderColor: "rgb(153, 102, 255)",
          tension: 0.1,
          yAxisID: "y2",
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "CPU and Memory Usage Over Time (Node)",
        },
        legend: {
          display: true,
          position: "top",
          labels: {
            boxHeight: 0,
          },
        },
        annotation: {
          annotations: generateAnnotations(sections),
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
    fs.writeFileSync(
      `./src/results/system/${endpoint}_output_graph.png`,
      buffer
    );
    console.log(`Graph saved as ${endpoint}_output_graph.png`);
  } catch (error) {
    console.error("Error saving graph:", error);
  }
}

function padData(commandData: LogEntry[], allTimestamps: string[]) {
  const paddedData = allTimestamps.map((timestamp) => {
    const existingData = commandData.find((d) => d.timestamp === timestamp);
    return existingData
      ? existingData
      : {
          timestamp,
          command: "node",
          cpu: 0.0,
          mem: 0.0,
          rss: 0.0,
        };
  });
  return paddedData;
}

interface Section {
  start: string;
  end: string;
  label: string;
}

function defineSections(timestamps: string[]): Section[] {
  const sectionEnd = timestamps.indexOf(process.argv[3]);
  return [
    { start: timestamps[0], end: timestamps[sectionEnd], label: "RPS Test" },
    {
      start: timestamps[sectionEnd + 1],
      end: timestamps[timestamps.length - 1],
      label: "Breakdown Test",
    },
  ];
}

function generateAnnotations(sections: Section[]) {
  const annotations: AnnotationOptions[] = [];

  sections.forEach((section, index) => {
    // Add vertical line at the start of each section (except the first one)
    if (index > 0) {
      annotations.push({
        type: "line",
        scaleID: "x",
        value: section.start,
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 2,
        borderDash: [6, 6],
      });
    }

    // Add background label for each section
    annotations.push({
      type: "box",
      xMin: section.start,
      xMax: section.end,
      yMin: 0,
      yMax: "max", // "max" is used to cover the whole Y axis
      backgroundColor: `rgba(75, 192, 192, ${0.05 + index * 0.05})`,
      borderColor: "transparent",
      label: {
        content: section.label, // Label for the section
        position: "start", // Position the label in the center of the box
        color: "rgb(225, 234, 205)", // Text color for the label
        font: {
          weight: "bold",
          size: 12,
        },
        opacity: 0,
        // padding: 10, // Ensure there's padding around the text
        display: true,
      },
    });
  });

  return annotations;
}

// Main function
async function main(endpoint: string): Promise<void> {
  const data = parseLogFile(`./src/results/system/${endpoint}_output.log`);
  await createChart(data);
}

main(endpoint).catch(console.error);
