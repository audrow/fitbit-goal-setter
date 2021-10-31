import { getFitbitDate } from "./index.ts";
import { assertEquals } from "../deps.test.ts";

Deno.test({
  name: "get date string in desired Fitbit format",
  fn: () => {
    const testCases: {
      date: string | Date;
      expected: string;
      comment?: string;
    }[] = [
      { date: "today", expected: "today", comment: "passing 'today' through" },
      {
        date: "2020-01-01",
        expected: "2020-01-01",
        comment: "passing string through",
      },
      {
        date: new Date(2020, 0, 1),
        expected: "2020-01-01",
        comment: "passing date object",
      },
    ];
    testCases.forEach((testCase) => {
      const dateStr = getFitbitDate(testCase.date);
      assertEquals(testCase.expected, dateStr, testCase.comment);
    });
  },
});
