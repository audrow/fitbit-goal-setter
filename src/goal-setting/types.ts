export type GoalSettingConfig = {
  numOfWeeks: number;
  weekly: {
    minSteps: number;
    finalGoal: number;
    minImprovementRatio: number;
  };
  daily: {
    daysPerWeek: number;
    maxImprovementRatio: number;
  };
};
