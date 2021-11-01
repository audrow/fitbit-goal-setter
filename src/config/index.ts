import { parse } from "../deps.ts";
import type { Configuration } from "./types.ts";

export async function load(env = "dev"): Promise<Configuration> {
  const configuration = parse(
    await Deno.readTextFile(`./config.${env}.yaml`),
  ) as Configuration;
  return {
    ...configuration,
  };
}
