import type { GoalSettingConfig } from "./types.ts";

const MS_PER_WEEK = 604800000;

export function getWeekGoal(
  stepsLastWeek: number,
  startDate: Date,
  currentDate = new Date(),
  config: GoalSettingConfig,
) {
  const weekNumber = getWeekNumber(startDate, currentDate);

  if (weekNumber >= config.numOfWeeks) {
    console.warn(
      `Week number ${weekNumber} is greater than the number of weeks in the goal setting period.`,
    );
    return stepsLastWeek;
  }

  const minGoal = stepsLastWeek * config.weekly.minImprovementRatio;
  if (minGoal < config.weekly.minSteps) {
    console.warn(`Setting steps to the minimum`);
    return config.weekly.minSteps;
  } else if (minGoal > config.weekly.finalGoal) {
    return minGoal;
  } else {
    const weeksRemaining = config.numOfWeeks - weekNumber;
    if (weeksRemaining < 1) {
      throw new Error(
        `Weeks remaining is ${weeksRemaining} and should never be less than one here, if it is something is wrong with the program logic`,
      );
    }
    const d_goal = (config.weekly.finalGoal - stepsLastWeek) / weeksRemaining;
    return stepsLastWeek + d_goal;
  }
}

export function getWeekNumber(currentDate: Date, startDate: Date) {
  const msBetweenDates = currentDate.getTime() - startDate.getTime();
  return Math.floor(msBetweenDates / MS_PER_WEEK) + 1;
}
