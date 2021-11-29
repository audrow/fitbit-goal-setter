import { readIntradayStepsFromCsv, writeIntradayStepsToCsv } from "./index.ts";
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
