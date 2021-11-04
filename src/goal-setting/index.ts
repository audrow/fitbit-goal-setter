import type { GoalSettingConfig } from "./types.ts";
import { getDayNumber, getWeekNumber } from "../utils/index.ts";

const DAYS_IN_WEEK = 7;

export function getDayGoal(
  weekGoal: number,
  stepsSoFar: number,
  startDate: Date,
  currentDate: Date,
  config: GoalSettingConfig,
) {
  const weekDayNumber = getDayNumber(currentDate, startDate) % DAYS_IN_WEEK;
  const daysRemaining = DAYS_IN_WEEK - weekDayNumber;

  const stepsRemaining = weekGoal - stepsSoFar;
  if (config.daily.daysPerWeek < 1 || config.daily.daysPerWeek > 7) {
    throw new Error("Days per week must be between 1 and 7");
  }
  const averageStepsPerDay = weekGoal / config.daily.daysPerWeek;
  const maxStepsPerDay = Math.ceil(
    averageStepsPerDay * config.daily.maxImprovementRatio,
  );
  const recommendedStepsPerDay = Math.ceil(
    stepsRemaining / Math.min(
      daysRemaining,
      config.daily.daysPerWeek,
    ),
  );
  return Math.ceil(
    Math.min(
      Math.max(recommendedStepsPerDay, averageStepsPerDay),
      maxStepsPerDay,
    ),
  );
}

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
    return Math.ceil(config.weekly.minSteps);
  } else if (minGoal > config.weekly.finalGoal) {
    return Math.ceil(minGoal);
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
    return Math.ceil(
      Math.max(minGoal, stepsLastWeek + dGoal),
    );
  }
}
