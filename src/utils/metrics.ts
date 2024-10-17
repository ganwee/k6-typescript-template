import { Trend, Rate, Counter } from "k6/metrics";
import exec from "k6/execution";
import { fail } from "k6";
import { MetricType, TestType } from "./enums";
import { GetEndpoints, PostEndpoints } from "./endpoints";

export function createMetrics(
  customMetrics: Object,
  rate: any,
  trend: any,
  counter: any
) {
  for (const [k, v] of Object.entries(customMetrics)) {
    rate[k] = new Rate(`${v}_rate`);
    trend[k] = new Trend(`${v}_trend`);
    counter[k] = new Counter(`${v}_counter`);
  }
}

export function addMetric(
  endpoint: GetEndpoints | PostEndpoints,
  testType: TestType,
  rate: any,
  trend: any,
  counter: any
) {
  const metricKey = `${endpoint}_${testType}`;
  rate[metricKey] = new Rate(`${metricKey}_rate`);
  trend[metricKey] = new Trend(`${metricKey}_trend`);
  counter[metricKey] = new Counter(`${metricKey}_counter`);
}

export function addThreshold(
  thresholds: any,
  endpoint: GetEndpoints | PostEndpoints | undefined,
  testType: TestType | undefined,
  metricType: MetricType,
  config = {}
) {
  thresholds[`${endpoint}_${testType}_${metricType}`] = [config];
}

export function checkAndVerifyMetrics(
  rate: any,
  trend: any,
  counter: any,
  metricKey: string,
  response: any
) {
  counter[metricKey].add(true);
  trend[metricKey].add(response.timings.waiting);
  if (response.status === 200 || response.status === 201) {
    rate[metricKey].add(true);
  } else {
    rate[metricKey].add(false);
    fail(
      `[Error-VU-${exec.vu.iterationInInstance}][${metricKey}] Failed: ${response.body}`
    );
  }
}
