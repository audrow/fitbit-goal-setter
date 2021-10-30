import {
  readDaySummaryFromCsv,
  readIntradayStepsFromCsv,
  writeDaySummaryToCsv,
  writeIntradayStepsToCsv,
} from "./index.ts";
import { intraDayStepsEntry } from "../fitbit-api/types.ts";
import { assertEquals } from "../deps.test.ts";
import { join } from "../deps.ts";

const mockSteps: { time: string; value: number }[] = [
  { time: "1", value: 0 },
  { time: "2", value: 1 },
  { time: "3", value: 2 },
  { time: "4", value: 3 },
  { time: "5", value: 4 },
  { time: "6", value: 5 },
  { time: "7", value: 6 },
  { time: "8", value: 7 },
  { time: "9", value: 8 },
  { time: "10", value: 9 },
  { time: "11", value: 10 },
  { time: "12", value: 11 },
  { time: "13", value: 12 },
  { time: "14", value: 13 },
  { time: "15", value: 14 },
  { time: "16", value: 15 },
  { time: "17", value: 16 },
  { time: "18", value: 17 },
  { time: "19", value: 18 },
  { time: "20", value: 19 },
];

Deno.test({
  name: "read empty intraday steps file returns empty list",
  fn: async () => {
    const cachingDir = await Deno.makeTempDir({ dir: Deno.cwd() });
    const cachingFile = "intraday-steps.csv";
    const file = join(cachingDir, cachingFile);

    const readData: intraDayStepsEntry[] = await readIntradayStepsFromCsv(file);
    await Deno.remove(cachingDir, { recursive: true });

    assertEquals([], readData);
  },
});

Deno.test({
  name: "read and write intraday steps",
  fn: async () => {
    const cachingDir = await Deno.makeTempDir({ dir: Deno.cwd() });
    const cachingFile = "intraday-steps.csv";
    const file = join(cachingDir, cachingFile);

    await writeIntradayStepsToCsv(mockSteps, file);
    const readData: intraDayStepsEntry[] = await readIntradayStepsFromCsv(file);
    await Deno.remove(cachingDir, { recursive: true });

    assertEquals(mockSteps, readData);
  },
});

Deno.test({
  name: "read empty summary returns empty list",
  fn: async () => {
    const cachingDir = await Deno.makeTempDir({ dir: Deno.cwd() });
    const cachingFile = "intraday-summary.csv";
    const file = join(cachingDir, cachingFile);

    const readData = await readDaySummaryFromCsv(file);
    await Deno.remove(cachingDir, { recursive: true });

    assertEquals([], readData);
  },
});

Deno.test({
  name: "read and write summary to file",
  fn: async () => {
    const cachingDir = await Deno.makeTempDir({ dir: Deno.cwd() });
    const cachingFile = "intraday-summary.csv";
    const file = join(cachingDir, cachingFile);
    const inputData = [
      {
        date: new Date(2020, 1, 1),
        activeSteps: 2000,
        stepsGoal: 3000,
        metGoal: false, // not passed into writer
      },
      {
        date: new Date(2020, 1, 2),
        activeSteps: 4000,
        stepsGoal: 3000,
        metGoal: true, // not passed into writer
      },
      {
        date: new Date(2020, 1, 3),
        activeSteps: 4000,
        stepsGoal: 5000,
        metGoal: false, // not passed into writer
      },
    ];
    for (const obj of inputData) {
      await writeDaySummaryToCsv(file, {
        date: obj.date,
        activeSteps: obj.activeSteps,
        stepsGoal: obj.stepsGoal,
      });
    }
    const outData = await readDaySummaryFromCsv(file);

    await Deno.remove(cachingDir, { recursive: true });

    for (let idx = 0; idx < inputData.length; idx++) {
      assertEquals(inputData[idx].date, outData[idx].date);
      assertEquals(inputData[idx].activeSteps, outData[idx].activeSteps);
      assertEquals(inputData[idx].stepsGoal, outData[idx].stepsGoal);
      assertEquals(inputData[idx].metGoal, outData[idx].metGoal);
    }
  },
});
