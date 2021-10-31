import { ensureDir, exists, join, readCSVObjects, writeCSV } from "../deps.ts";
import type { intraDayStepsEntry } from "../fitbit-api/types.ts";
import { getDateRange, getDateString } from "../utils/index.ts";
import { getIntradaySteps } from "../fitbit-api/index.ts";

export async function writeIntradayStepsToCsv(
  steps: { time: string; value: number }[],
  file: string,
) {
  const f = await Deno.open(file, { write: true, createNew: true });
  const header = ["time", "value"];
  const data = steps.map((d) => [d.time, d.value.toString()])
    .map((d) => Object.values(d));
  await writeCSV(f, [header, ...data]);
  f.close();
}

export async function readIntradayStepsFromCsv(file: string) {
  if (!await exists(file)) {
    return [];
  }
  const f = await Deno.open(file, { read: true });
  const data: intraDayStepsEntry[] = [];
  for await (const obj of readCSVObjects(f)) {
    const time = obj.time;
    const value = Number(obj.value);
    data.push({ time, value });
  }
  f.close();
  return data;
}

export async function writeDaySummaryToCsv(
  file: string,
  info: {
    date: Date;
    stepsGoal: number;
    activeSteps: number;
  },
) {
  const header = ["date", "steps goal", "active steps", "met goal"];
  const newData = [
    info.date.toLocaleDateString(),
    info.stepsGoal.toString(),
    info.activeSteps.toString(),
    (info.activeSteps >= info.stepsGoal).toString(),
  ];
  let data = [];
  const fileExists = await exists(file);
  if (fileExists) {
    const oldData = (await readDaySummaryFromCsvString(file));
    data = [...oldData, newData];
  } else {
    data = [newData];
  }
  const f = await Deno.open(file, { write: true, createNew: !fileExists });
  await writeCSV(f, [header, ...data]);
  f.close();
}

async function readDaySummaryFromCsvString(file: string) {
  if (!await exists(file)) {
    return [];
  }
  const f = await Deno.open(file, { read: true });
  const data = [];
  for await (const obj of readCSVObjects(f)) {
    data.push([
      obj["date"],
      obj["steps goal"],
      obj["active steps"],
      obj["met goal"],
    ]);
  }
  f.close();
  return data;
}

export async function readDaySummaryFromCsv(file: string) {
  const data = await readDaySummaryFromCsvString(file);
  return data.map((row) => {
    return {
      date: new Date(row[0]),
      stepsGoal: Number(row[1]),
      activeSteps: Number(row[2]),
      metGoal: row[3] === "true",
    };
  });
}

export async function pullIntradaySteps(
  startDate: Date,
  endDate: Date,
  deviceName: string,
  accessToken: string,
) {
  const dates = getDateRange(startDate, endDate);
  const dir = join("data", "intraday-steps", deviceName);
  await ensureDir(dir);
  for (const date of dates) {
    const dateStr = getDateString(date);
    const file = join(dir, `${dateStr}.csv`);
    if (await exists(file)) {
      console.log(`skipping ${dateStr} because it already exists`);
    } else {
      console.log(`saving data for ${dateStr}`);
      const steps = await getIntradaySteps(accessToken, date);
      await writeIntradayStepsToCsv(steps, file);
    }
  }
}

// export async function summarizeData(startDate: Date, endDate: Date, accessToken: string) {
// }

// const token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM0JNNzIiLCJzdWIiOiI1VllYNjkiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJhY3QgcnNldCBybG9jIHJ3ZWkgcmhyIHJudXQgcnBybyByc2xlIiwiZXhwIjoxNjY2MzY0NDU4LCJpYXQiOjE2MzQ4Mjg0NTh9.jgF4MYOQsUTj9AZdnUcFRTPh2MMZsWu6HThpRhGcqCg"
// const deviceName = "michelley's fitbit"
// await pullIntradaySteps(new Date(2021, 9, 21), new Date(2021, 9, 30), deviceName, token)
