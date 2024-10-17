import http from "k6/http";
import {
  addMetric,
  addThreshold,
  checkAndVerifyMetrics,
} from "../utils/metrics";
import { api, GetEndpoints, PostEndpoints } from "../utils/endpoints";
import { formatObjectToJSON } from "../utils/helpers";
import { textSummary } from "../utils/k6-helpers/testSummary";
import { MetricType, RestType, TestType } from "../utils/enums";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

//Timing Config
let cumulativeStartTime = 0;
const rpsRampUp = "30s";
const rpsConstant = "5m";
const rpsRampDown = "30s";
const breakdownRampUp = "20m";
const breakdownRampDown = "15s";

let rate: Record<string, string> = {};
let trend: Record<string, string> = {};
let counter: Record<string, string> = {};

export const options: any = {
  scenarios: {},
  thresholds: {},
};

const testType = __ENV.TEST_TYPE ? (__ENV.TEST_TYPE as TestType) : undefined;
const restType = __ENV.REST_TYPE ? (__ENV.REST_TYPE as RestType) : undefined;
const apiParams = __ENV.PARAMS ? formatObjectToJSON(__ENV.PARAMS) : "";
const endpoint = __ENV.ENDPOINT
  ? (__ENV.ENDPOINT as GetEndpoints | PostEndpoints)
  : undefined;
const resultsPath = __ENV.RESULTS_PATH
  ? __ENV.RESULTS_PATH
  : `./src/results/${endpoint}_${testType}.html`; //hardcoded filePath is relative to root directory (project folder)

addThreshold(options.thresholds, endpoint, testType, MetricType.RATE, {
  threshold: "rate>0.99",
  abortOnFail: true, // boolean
  delayAbortEval: "10s", // string
});

if (!endpoint || !testType || !restType) {
  throw new Error(
    `endpoint, testType or restType undefined. Received endpoint: ${endpoint}, testType: ${testType}, restType: ${restType}`
  );
}
if (
  !(
    Object.values(GetEndpoints).includes(endpoint as GetEndpoints) ||
    Object.values(PostEndpoints).includes(endpoint as PostEndpoints)
  )
) {
  throw new Error("Endpoint provided not configured.");
}
if (!Object.values(TestType).includes(testType)) {
  throw new Error("TestType provided not configured.");
}
if (!Object.values(RestType).includes(restType)) {
  throw new Error("RestType provided not configured.");
}

if (testType === TestType.RPS) {
  addMetric(endpoint, TestType.RPS, rate, trend, counter);
  options.scenarios[`rpsTest_${endpoint}`] = {
    executor: "ramping-arrival-rate",
    startRate: 0,
    timeUnit: "1s",
    preAllocatedVUs: 1000,
    stages: [
      { target: 50, duration: rpsRampUp },
      { target: 50, duration: rpsConstant },
      { target: 0, duration: rpsRampDown },
    ],
    env: {
      METRIC_KEY: `${endpoint}_${TestType.RPS}`,
    },
    exec: "performanceTest",
  };
}

if (testType === TestType.BREAKDOWN) {
  addMetric(endpoint, TestType.BREAKDOWN, rate, trend, counter);
  options.scenarios[`breakpointTest_${endpoint}`] = {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { target: 50000, duration: breakdownRampUp }, //ramp up
      { target: 0, duration: breakdownRampDown }, //ramp down
    ],
    gracefulRampDown: "10s",
    exec: "performanceTest",
    startTime: `${cumulativeStartTime}s`, //delays test start time by specified amt (so that test runs sequentially)
    env: {
      METRIC_KEY: `${endpoint}_${TestType.BREAKDOWN}`,
    },
  };
}

export function performanceTest() {
  const httpParams = {
    headers: {
      apiKey: "performance",
    },
  };

  let res: any;
  if (endpoint) {
    switch (restType) {
      case RestType.GET:
        res = http.get(
          api.get[endpoint as GetEndpoints](JSON.parse(apiParams)),
          httpParams
        );
        break;
      case RestType.POST:
        res = http.post(
          api.post[endpoint as PostEndpoints](),
          JSON.parse(apiParams),
          httpParams
        );
        break;
      default:
        throw new Error(
          `Rest method provided is not of enum [${Object.values(RestType)}].`
        );
    }
  }
  checkAndVerifyMetrics(rate, trend, counter, __ENV.METRIC_KEY, res);
}

//Called by k6 at end of test execution to generate output file to visualise performance test metrics
export function handleSummary(data: any) {
  return {
    [resultsPath]: htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
