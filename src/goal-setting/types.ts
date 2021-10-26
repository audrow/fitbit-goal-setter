export type GoalSettingConfig = {
  numOfWeeks: number;
  weekly: {
    minSteps: number;
    finalGoal: number;
    daysPerWeek: number;
    minImprovementRatio: number;
  };
};
