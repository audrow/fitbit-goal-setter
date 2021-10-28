import { readCSVObjects, writeCSV } from "../deps.ts";
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
