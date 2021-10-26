import type { GoalSettingConfig } from "./types.ts";

const MS_PER_WEEK = 604800000;

export function getWeekGoal(
  stepsLastWeek: number,
  startDate: Date,
  currentDate = new Date(),
  config: GoalSettingConfig,
) {
  const weekNumber = getWeekNumber(currentDate, startDate);

  if (weekNumber >= config.numOfWeeks + 1) {
    throw new Error(
      `Week number ${weekNumber} is greater than the number of weeks in the goal setting period (${config.numOfWeeks} weeks).`,
    );
  }

  const minGoal = Math.round(stepsLastWeek * config.weekly.minImprovementRatio);
  console.log(`Min goal: ${minGoal}`);
  if (minGoal < config.weekly.minSteps) {
    console.warn(`Setting steps to the minimum`);
    return config.weekly.minSteps;
  } else if (minGoal > config.weekly.finalGoal) {
    console.log(`exit 2`);
    return minGoal;
  } else {
    const weeksRemaining = config.numOfWeeks - weekNumber + 1;
    console.log(`num weeks: ${config.numOfWeeks} - Week #: ${weekNumber}`);
    if (weeksRemaining < 1) {
      throw new Error(
        `Weeks remaining is ${weeksRemaining} and should never be less than one here, if it is something is wrong with the program logic`,
      );
    }
    const dGoal = Math.round(
      (config.weekly.finalGoal - stepsLastWeek) / weeksRemaining,
    );
    console.log(`dGoal: ${dGoal}, weeksRemaining: ${weeksRemaining}`);
    return Math.max(minGoal, stepsLastWeek + dGoal);
  }
}

export function getWeekNumber(currentDate: Date, startDate: Date) {
  const msBetweenDates = currentDate.getTime() - startDate.getTime();
  return Math.floor(msBetweenDates / MS_PER_WEEK) + 1;
}
