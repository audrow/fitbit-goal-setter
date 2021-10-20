import { parse } from "../deps.ts";

type Configuration = {
  fitbit: {
    devices: {
      name: string;
      accessToken: string;
    }[];
  };
  accessTokens: string[];
};

export async function load(env = "dev"): Promise<Configuration> {
  const configuration = parse(
    await Deno.readTextFile(`./config.${env}.yaml`),
  ) as Configuration;
  return {
    ...configuration,
  };
}
