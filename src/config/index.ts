import { parse } from "../deps.ts";
import type { Configuration } from "./types.ts";

const MS_PER_MIN = 60 * 1000;

export async function load(file: string): Promise<Configuration> {
  const configuration = parse(
    await Deno.readTextFile(file),
  ) as Configuration;

  // Fix interpreting date as UTC timezone and set it to the current timezone
  const tzOffset = new Date().getTimezoneOffset() * MS_PER_MIN;
  for (const device of configuration.fitbit.devices) {
    device.startStudyDate.setTime(device.startStudyDate.getTime() + tzOffset);
    device.startInterventionDate.setTime(
      device.startInterventionDate.getTime() + tzOffset,
    );
  }

  return {
    ...configuration,
  };
}
