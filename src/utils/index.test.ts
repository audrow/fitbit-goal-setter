import {
  getDateRange,
  getDateString,
  getDayNumber,
  getWeekNumber,
} from "./index.ts";
import { assertEquals, assertThrows } from "../deps.test.ts";

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

Deno.test({
  name: "get dates in a range",
  fn: () => {
    const testCases: {
      start: Date;
      end: Date;
      expected: Date[];
      comment?: string;
    }[] = [
      {
        start: new Date(2020, 1, 1),
        end: new Date(2020, 1, 1),
        expected: [new Date(2020, 1, 1)],
        comment: "same day",
      },
      {
        start: new Date(2020, 1, 1),
        end: new Date(2020, 1, 2),
        expected: [new Date(2020, 1, 1), new Date(2020, 1, 2)],
        comment: "next day",
      },
      {
        start: new Date(2020, 0, 31),
        end: new Date(2020, 1, 2),
        expected: [
          new Date(2020, 0, 31),
          new Date(2020, 1, 1),
          new Date(2020, 1, 2),
        ],
        comment: "cross month",
      },
      {
        start: new Date(2020, 11, 31),
        end: new Date(2021, 0, 2),
        expected: [
          new Date(2020, 11, 31),
          new Date(2021, 0, 1),
          new Date(2021, 0, 2),
        ],
        comment: "cross year",
      },
    ];
    testCases.forEach((testCase) => {
      const dateRange = getDateRange(testCase.start, testCase.end);
      assertEquals(dateRange.length, testCase.expected.length);
      assertEquals(testCase.expected, dateRange, testCase.comment);
    });
  },
});

Deno.test({
  name: "error if start date is after end date",
  fn: () => {
    assertThrows(() => {
      getDateRange(new Date(2021, 0, 1), new Date(2020, 0, 1));
    });
  },
});

Deno.test({
  name: "get date string",
  fn: () => {
    const testCases: { date: Date; expected: string }[] = [
      { date: new Date(2020, 0, 1), expected: "2020-01-01" },
      { date: new Date(2020, 0, 31), expected: "2020-01-31" },
      { date: new Date(2020, 1, 1), expected: "2020-02-01" },
    ];
    testCases.forEach((testCase) => {
      assertEquals(testCase.expected, getDateString(testCase.date));
    });
  },
});
