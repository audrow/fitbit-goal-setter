import { assertEquals } from "https://deno.land/std@0.112.0/testing/asserts.ts";

import { getWeekGoal, getWeekNumber } from "./goalSetting.ts";
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
        `for dates ${testCase.startDate} and ${testCase.testDate}`,
      );
    });
  },
});

const config: GoalSettingConfig = {
  numOfWeeks: 2,
  weekly: {
    minSteps: 10,
    finalGoal: 20,
    daysPerWeek: 5,
    minImprovementRatio: 1.1,
  },
};

Deno.test({
  name: "TODO test getting the week goal",
  fn: () => {
    const testCases: {
      expected: number;
      stepsLastWeek: number;
      startDate: string;
      testDate: string;
    }[] = [
      {
        expected: 1,
        stepsLastWeek: 10,
        startDate: "2020-01-01",
        testDate: "2020-01-01",
      },
    ];
    testCases.forEach((testCase) => {
      const actual = getWeekGoal(
        testCase.stepsLastWeek,
        new Date(testCase.startDate),
        new Date(testCase.testDate),
        config,
      );
      console.log(actual, testCase.expected);
      // assertEquals(actual, testCase.expected, `for dates ${testCase.startDate} and ${testCase.testDate}`)
    });
  },
});
