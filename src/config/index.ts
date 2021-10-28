import { parse } from "../deps.ts";
import { ActiveStepsConfig } from "../active-steps/types.ts";
import { GoalSettingConfig } from "../goal-setting/types.ts";

type Configuration = {
  fitbit: {
    devices: {
      name: string;
      accessToken: string;
      startStudyDate: Date;
      startInterventionDate: string;
    }[];
    activeSteps: ActiveStepsConfig;
  };
  goalSetting: GoalSettingConfig;
};

export async function load(env = "dev"): Promise<Configuration> {
  const configuration = parse(
    await Deno.readTextFile(`./config.${env}.yaml`),
  ) as Configuration;
  return {
    ...configuration,
  };
}
