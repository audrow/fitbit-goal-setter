import type { GoalSettingConfig } from "./types.ts";

const MS_IN_DAY = 86400000;

export function getWeekGoal(
  stepsLastWeek: number,
  startDate: Date,
  currentDate = new Date(),
  config: GoalSettingConfig,
) {
  const weekNumber = getWeekNumber(currentDate, startDate);

  if (weekNumber < 1) {
    throw new Error(
      `Week number ${weekNumber} is less than 1, meaning you're trying a date before the start date of the study`,
    );
  }
  if (weekNumber >= config.numOfWeeks + 1) {
    throw new Error(
      `Week number ${weekNumber} is greater than the number of weeks in the goal setting period (${config.numOfWeeks} weeks),` +
        ` meaning that you're trying a date after the study has completed`,
    );
  }

  const minGoal = Math.round(stepsLastWeek * config.weekly.minImprovementRatio);
  if (minGoal < config.weekly.minSteps) {
    return config.weekly.minSteps;
  } else if (minGoal > config.weekly.finalGoal) {
    return minGoal;
  } else {
    const weeksRemaining = config.numOfWeeks - weekNumber + 1;
    if (weeksRemaining < 1) {
      throw new Error(
        `Weeks remaining is ${weeksRemaining} and should never be less than one here, if it is something is wrong with the program logic`,
      );
    }
    const dGoal = Math.round(
      (config.weekly.finalGoal - stepsLastWeek) / weeksRemaining,
    );
    return Math.max(minGoal, stepsLastWeek + dGoal);
  }
}

export function getDayNumber(currentDate: Date, startDate: Date): number {
  const msBetweenDates = currentDate.getTime() - startDate.getTime();
  return Math.floor(msBetweenDates / MS_IN_DAY);
}

export function getWeekNumber(currentDate: Date, startDate: Date) {
  return Math.floor(getDayNumber(currentDate, startDate) / 7) + 1;
}
