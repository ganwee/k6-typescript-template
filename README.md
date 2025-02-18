# Performance Test Repo Template
This repository is designed for performance testing using k6, written in TypeScript. It serves as a template to build, configure, and run performance tests with ease.

## Key Features
- **Flexible Executors**: Uses various k6 executors to achieve different performance testing objectives (e.g. average response time @ 50 RPS, determining system throughput before failure)
- **Parameterized Tests**: Easily configure and add different endpoints and HTTP methods for testing
- **Comprehensive Reporting**: Captures k6 console summaries and generates HTML reports for easy visualization and persistent storage
- **System Resource Logging**: Logs local CPU and memory usage (macOS), transforming it into visual graphs for performance insights

## Pre-requisites
1. Install k6 using Homebrew:
   ```
   brew install k6
   ```
2. Install Node.js dependencies:
   ```
   npm install
   ```
3. If Node.js installation for Chart.js fails, try resolving dependencies by running the following command:
   ```
   brew install pkg-config cairo pango libpng jpeg giflib librsvg
   ```
   Reference: https://github.com/Automattic/node-canvas/wiki#installation-guides

## Running Tests
1. From the root directory, execute: `./run_k6.sh`, OR
2. Run directly using npm: `npm run k6`

### Notes
The shell script takes in parameters from the file `testingData.csv` and passes it in as env variables to k6. <br />
Running k6 using Method #2 (npm) **will** fail because the necessary environment variables (from `testingData.csv`) are not present. <br />
Update the defaults of environment variables within the script and it should run successfully.

### Build Process
The repository uses npm as the build tool.<br />
Source code is written in TypeScript. Webpack and Babel are used to compile the TypeScript into JavaScript, which k6 can execute.
