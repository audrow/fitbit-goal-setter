import { exists, readCSVObjects, writeCSV } from "../deps.ts";
import type { intraDayStepsEntry } from "../fitbit-api/types.ts";

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
  date: Date,
  stepsGoal: number,
  activeSteps: number,
) {
  const header = ["date", "steps goal", "active steps", "met goal"];
  const newData = [
    date.toLocaleDateString(),
    stepsGoal.toString(),
    activeSteps.toString(),
    (activeSteps >= stepsGoal).toString(),
  ];
  console.log(newData);
  let data = [];
  if (await exists(file)) {
    const oldData = (await readDaySummaryFromCsvString(file));
    data = [...oldData, newData];
  } else {
    data = [newData];
  }
  const createNew = !await exists(file);
  const f = await Deno.open(file, { write: true, createNew: createNew });
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

// TODO remove this after tests are working
// const tempDir = `${Deno.cwd()}/temp`;
// if (!await exists(tempDir)) {
//   await Deno.mkdir(tempDir);
// }
// const file = `${tempDir}/summary.csv`;

// console.log(
//   await readDaySummaryFromCsv(file)
// )

// await writeDaySummaryToCsv(file, new Date(), 10000, 5000);
// await writeDaySummaryToCsv(file, new Date(), 20000, 20000);
// await writeDaySummaryToCsv(file, new Date(), 30000, 5000);

// console.log(
//   await readDaySummaryFromCsv(file)
// )

// await Deno.remove(tempDir, { recursive: true });
