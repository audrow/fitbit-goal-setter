import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.112.0/testing/asserts.ts";

import {
  getWeekGoal,
  getWeekNumber,
  getDayNumber,
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
    daysPerWeek: 5,
    minImprovementRatio: 1.1,
  },
};

const configRealisticStudy: GoalSettingConfig = {
  numOfWeeks: 6,
  weekly: {
    minSteps: 2000,
    finalGoal: 10000,
    daysPerWeek: 5,
    minImprovementRatio: 1.1,
  },
};

const configHighImprovementRatio: GoalSettingConfig = {
  numOfWeeks: 10,
  weekly: {
    minSteps: 10,
    finalGoal: 100,
    daysPerWeek: 5,
    minImprovementRatio: 2.5,
  },
};

const configShortStudy: GoalSettingConfig = {
  numOfWeeks: 2,
  weekly: {
    minSteps: 10,
    finalGoal: 100,
    daysPerWeek: 5,
    minImprovementRatio: 1.5,
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
