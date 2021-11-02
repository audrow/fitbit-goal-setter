import { parse } from "../deps.ts";
import type { Configuration } from "./types.ts";

export async function load(file = "config.yaml"): Promise<Configuration> {
  const configuration = parse(
    await Deno.readTextFile(file),
  ) as Configuration;
  return {
    ...configuration,
  };
}
