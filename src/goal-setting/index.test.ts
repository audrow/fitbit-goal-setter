import { assertEquals, assertThrows } from "../deps.test.ts";

import {
  getDayGoal,
  getDayNumber,
  getWeekGoal,
  getWeekNumber,
} from "./index.ts";
import type { GoalSettingConfig } from "./types.ts";

Deno.test({
  name: "Get week number",
  fn: () => {
    const testCases: {
      expected: number;
      startDate: string;
      testDate: string;
    }[] = [
      { expected: 1, startDate: "2020-01-01", testDate: "2020-01-01" },
      { expected: 1, startDate: "2020-01-01", testDate: "2020-01-02" },
      { expected: 1, startDate: "2020-01-01", testDate: "2020-01-03" },
      { expected: 1, startDate: "2020-01-01", testDate: "2020-01-05" },
      { expected: 1, startDate: "2020-01-01", testDate: "2020-01-07" },
      { expected: 2, startDate: "2020-01-01", testDate: "2020-01-08" },
      { expected: 2, startDate: "2020-01-01", testDate: "2020-01-14" },
      { expected: 5, startDate: "2020-01-01", testDate: "2020-02-04" },
      { expected: 6, startDate: "2020-01-01", testDate: "2020-02-05" },
    ];
    testCases.forEach((testCase) => {
      const actual = getWeekNumber(
        new Date(testCase.testDate),
        new Date(testCase.startDate),
      );
      assertEquals(
        actual,
        testCase.expected,
        `expected ${testCase.expected}, got ${actual} ` +
          `for start date ${testCase.startDate} and end date ${testCase.testDate}`,
      );
    });
  },
});

Deno.test({
  name: "Get day number",
  fn: () => {
    const testCases: {
      expected: number;
      startDate: string;
      testDate: string;
    }[] = [
      { expected: 0, startDate: "2020-01-01", testDate: "2020-01-01" },
      { expected: 1, startDate: "2020-01-01", testDate: "2020-01-02" },
      { expected: 2, startDate: "2020-01-01", testDate: "2020-01-03" },
      { expected: 4, startDate: "2020-01-01", testDate: "2020-01-05" },
      { expected: 6, startDate: "2020-01-01", testDate: "2020-01-07" },
      { expected: 7, startDate: "2020-01-01", testDate: "2020-01-08" },
      { expected: 13, startDate: "2020-01-01", testDate: "2020-01-14" },
      { expected: 34, startDate: "2020-01-01", testDate: "2020-02-04" },
      { expected: 35, startDate: "2020-01-01", testDate: "2020-02-05" },
    ];
    testCases.forEach((testCase) => {
      const actual = getDayNumber(
        new Date(testCase.testDate),
        new Date(testCase.startDate),
      );
      assertEquals(
        actual,
        testCase.expected,
        `expected ${testCase.expected}, got ${actual} ` +
          `for start date ${testCase.startDate} and end date ${testCase.testDate}`,
      );
    });
  },
});

const configLongStudy: GoalSettingConfig = {
  numOfWeeks: 10,
  weekly: {
    minSteps: 10,
    finalGoal: 100,
    minImprovementRatio: 1.1,
  },
  daily: {
    daysPerWeek: 5,
    maxImprovementRatio: 2.0,
  },
};

const configRealisticStudy: GoalSettingConfig = {
  numOfWeeks: 6,
  weekly: {
    minSteps: 2000,
    finalGoal: 10000,
    minImprovementRatio: 1.1,
  },
  daily: {
    daysPerWeek: 5,
    maxImprovementRatio: 2.0,
  },
};

const configHighImprovementRatio: GoalSettingConfig = {
  numOfWeeks: 10,
  weekly: {
    minSteps: 10,
    finalGoal: 100,
    minImprovementRatio: 2.5,
  },
  daily: {
    daysPerWeek: 5,
    maxImprovementRatio: 2.0,
  },
};

const configShortStudy: GoalSettingConfig = {
  numOfWeeks: 2,
  weekly: {
    minSteps: 10,
    finalGoal: 100,
    minImprovementRatio: 1.5,
  },
  daily: {
    daysPerWeek: 5,
    maxImprovementRatio: 2.0,
  },
};
Deno.test({
  name: "test getting the week goal",
  fn: () => {
    const testCases: {
      expected: number;
      stepsLastWeek: number;
      startDate: string;
      testDate: string;
      config: GoalSettingConfig;
      comment?: string;
    }[] = [
      {
        expected: 10,
        stepsLastWeek: 0,
        startDate: "2020-01-01",
        testDate: "2020-01-01",
        config: configLongStudy,
        comment: "first week use minimum",
      },
      {
        expected: 19,
        stepsLastWeek: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-01",
        config: configLongStudy,
        comment: "first week use dGoal",
      },
      {
        expected: 19,
        stepsLastWeek: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-02",
        config: configLongStudy,
        comment: "first week consistency between week",
      },
      {
        expected: 19,
        stepsLastWeek: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-07",
        config: configLongStudy,
        comment: "first week consistency between week in last day of week",
      },
      {
        expected: 55,
        stepsLastWeek: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-01",
        config: configShortStudy,
        comment: "first week with short study",
      },
      {
        expected: 25,
        stepsLastWeek: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-01",
        config: configHighImprovementRatio,
        comment: "first week use min goal from improvement ratio",
      },
      {
        expected: 10,
        stepsLastWeek: 0,
        startDate: "2020-01-01",
        testDate: "2020-01-08",
        config: configShortStudy,
        comment: "last week with short study where they do no steps",
      },
      {
        expected: 100,
        stepsLastWeek: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-08",
        config: configShortStudy,
        comment: "last week with short study finishes successfully",
      },
      {
        expected: 100,
        stepsLastWeek: 55,
        startDate: "2020-01-01",
        testDate: "2020-01-08",
        config: configShortStudy,
        comment: "last week with short study finishes successfully",
      },
      {
        expected: 100,
        stepsLastWeek: 55,
        startDate: "2020-01-01",
        testDate: "2020-01-14",
        config: configShortStudy,
        comment:
          "last week with short study finishes successfully at end of week",
      },
      {
        expected: 3338,
        stepsLastWeek: 2005,
        startDate: "2020-01-01",
        testDate: "2020-01-01",
        config: configRealisticStudy,
        comment: "week 1 of a realistic setup",
      },
      {
        expected: 4670,
        stepsLastWeek: 3338,
        startDate: "2020-01-01",
        testDate: "2020-01-08",
        config: configRealisticStudy,
        comment: "week 2 of a realistic setup",
      },
      {
        expected: 6003,
        stepsLastWeek: 4670,
        startDate: "2020-01-01",
        testDate: "2020-01-15",
        config: configRealisticStudy,
        comment: "week 3 of a realistic setup",
      },
      {
        expected: 7335,
        stepsLastWeek: 6003,
        startDate: "2020-01-01",
        testDate: "2020-01-22",
        config: configRealisticStudy,
        comment: "week 4 of a realistic setup",
      },
      {
        expected: 8668,
        stepsLastWeek: 7335,
        startDate: "2020-01-01",
        testDate: "2020-01-29",
        config: configRealisticStudy,
        comment: "week 5 of a realistic setup",
      },
      {
        expected: 10000,
        stepsLastWeek: 8668,
        startDate: "2020-01-01",
        testDate: "2020-02-05",
        config: configRealisticStudy,
        comment: "week 6 of a realistic setup",
      },
    ];
    testCases.forEach((testCase) => {
      const actual = getWeekGoal(
        testCase.stepsLastWeek,
        new Date(testCase.startDate),
        new Date(testCase.testDate),
        testCase.config,
      );
      assertEquals(actual, testCase.expected, testCase.comment);
    });
  },
});

Deno.test({
  name: "get goal throws error before study starts",
  fn: () => {
    assertThrows(() => {
      getWeekGoal(
        0,
        new Date("2020-01-01"),
        new Date("2019-12-31"),
        configShortStudy,
      );
    });
  },
});

Deno.test({
  name: "get goal throws error after study ends",
  fn: () => {
    assertThrows(() => {
      getWeekGoal(
        0,
        new Date("2020-01-01"),
        new Date("2020-01-15"),
        configShortStudy,
      );
    });
  },
});

Deno.test({
  name: "test getting the day goal",
  fn: () => {
    const testCases: {
      expected: number;
      weekGoal: number;
      stepsSoFar: number;
      startDate: string;
      testDate: string;
      config: GoalSettingConfig;
      comment?: string;
    }[] = [
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 0,
        startDate: "2020-01-01",
        testDate: "2020-01-01",
        config: configLongStudy,
        comment: "check first day",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-02",
        config: configLongStudy,
        comment: "check second day",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 0,
        startDate: "2020-01-01",
        testDate: "2020-01-08",
        config: configLongStudy,
        comment: "check first day of second week",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-09",
        config: configLongStudy,
        comment: "check second day of second week",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-03",
        config: configLongStudy,
        comment: "check skipping one day (walk 5 days / week)",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-04",
        config: configLongStudy,
        comment: "check skipping two days (walk 5 days / week)",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 30,
        startDate: "2020-01-01",
        testDate: "2020-01-06",
        config: configLongStudy,
        comment: "check sixth day",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 40,
        startDate: "2020-01-01",
        testDate: "2020-01-07",
        config: configLongStudy,
        comment: "check last day of week",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 30,
        startDate: "2020-01-01",
        testDate: "2020-01-13",
        config: configLongStudy,
        comment: "check sixth day of second week",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 40,
        startDate: "2020-01-01",
        testDate: "2020-01-14",
        config: configLongStudy,
        comment: "check last day of week of second week",
      },
      {
        expected: 20,
        weekGoal: 50,
        stepsSoFar: 0,
        startDate: "2020-01-01",
        testDate: "2020-01-06",
        config: configLongStudy,
        comment: "test limiting steps goal if they're behind",
      },
      {
        expected: 20,
        weekGoal: 50,
        stepsSoFar: 0,
        startDate: "2020-01-01",
        testDate: "2020-01-07",
        config: configLongStudy,
        comment: "test limiting steps goal if they're behind",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 50,
        startDate: "2020-01-01",
        testDate: "2020-01-06",
        config: configLongStudy,
        comment:
          "test if they've done more than required steps on second to last day",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 50,
        startDate: "2020-01-01",
        testDate: "2020-01-14",
        config: configLongStudy,
        comment:
          "test if they've done more than required steps on last day of the second week",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 50,
        startDate: "2020-01-01",
        testDate: "2020-01-13",
        config: configLongStudy,
        comment:
          "test if they've done more than required steps on second to last day of the second week",
      },
      {
        expected: 10,
        weekGoal: 50,
        stepsSoFar: 50,
        startDate: "2020-01-01",
        testDate: "2020-01-07",
        config: configLongStudy,
        comment: "test if they've done more than required steps on last day",
      },
    ];
    testCases.forEach((testCase) => {
      const actual = getDayGoal(
        testCase.weekGoal,
        testCase.stepsSoFar,
        new Date(testCase.startDate),
        new Date(testCase.testDate),
        testCase.config,
      );
      assertEquals(actual, testCase.expected, testCase.comment);
    });
  },
});

Deno.test({
  name: "get goal throws error before study starts",
  fn: () => {
    assertThrows(() => {
      getWeekGoal(
        0,
        new Date("2020-01-01"),
        new Date("2019-12-31"),
        configShortStudy,
      );
    });
  },
});

Deno.test({
  name: "get goal throws error after study ends",
  fn: () => {
    assertThrows(() => {
      getWeekGoal(
        0,
        new Date("2020-01-01"),
        new Date("2020-01-15"),
        configShortStudy,
      );
    });
  },
});
