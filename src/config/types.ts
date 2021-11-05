import { ActiveStepsConfig } from "../active-steps/types.ts";
import { GoalSettingConfig } from "../goal-setting/types.ts";

export type Configuration = {
  fitbit: {
    devices: {
      name: string;
      accessToken: string;
      startStudyDate: Date;
      startInterventionDate: Date;
    }[];
    debug: boolean;
  };
  activeSteps: ActiveStepsConfig;
  goalSetting: GoalSettingConfig;
};
