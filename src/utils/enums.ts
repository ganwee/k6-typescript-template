export type AggregatorSource = "source1" | "source2" | "source3" | "source4";

export enum RestType {
  GET = "get",
  POST = "post",
}

export enum TestType {
  BENCHMARK = "benchmark",
  STRESS = "stress",
  ENDURANCE = "endurance",
  RPS = "rps",
  BREAKDOWN = "breakdown",
}

export enum MetricType {
  GAUGE = "gauge",
  TREND = "trend",
  RATE = "rate",
  COUNTER = "counter",
}