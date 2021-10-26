import { assertEquals } from "https://deno.land/std@0.112.0/testing/asserts.ts";

import { getActiveSteps, processSteps } from "./index.ts";
import type { ActiveStepsConfig } from "./types.ts";

const testActiveStepsConfig: ActiveStepsConfig = {
  minDuration: 3,
  minStepsPerMin: 10,
  maxInactiveMin: 2,
};

type StepTestCases = {
  expected: any;
  steps: number[];
  comment?: string;
}[];

function testActiveSteps(testCases: StepTestCases) {
  testCases.forEach((testCase) => {
    assertEquals(
      testCase.expected,
      getActiveSteps(testCase.steps, testActiveStepsConfig),
      testCase.comment,
    );
  });
}

function testProcessSteps(testCases: StepTestCases) {
  testCases.forEach((testCase) => {
    assertEquals(
      testCase.expected,
      processSteps(testCase.steps, testActiveStepsConfig),
      testCase.comment,
    );
  });
}

Deno.test({
  name: "test valid active steps",
  fn: () => {
    testActiveSteps(
      [
        {
          expected: 50,
          steps: [10, 10, 10, 10, 10],
          comment: "continuous sum to 50",
        },
        {
          expected: 50,
          steps: [10, 10, 10, 0, 10, 10],
          comment: "one one minute gap sum to 50",
        },
        {
          expected: 50,
          steps: [10, 10, 10, 0, 0, 10, 10],
          comment: "one one two minute gap sum to 50",
        },
        {
          expected: 50,
          steps: [10, 10, 0, 10, 0, 10, 10],
          comment: "two one minute gaps sum to 50",
        },
        {
          expected: 50,
          steps: [10, 10, 0, 0, 10, 0, 0, 10, 10],
          comment: "two two minute gaps sum to 50",
        },
        {
          expected: 50,
          steps: [0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0],
          comment: "many one minute gaps sum to 50",
        },
        {
          expected: 50,
          steps: [0, 0, 10, 0, 0, 10, 0, 0, 10, 0, 0, 10, 0, 0, 10, 0, 0],
          comment: "many two minute gaps sum to 50",
        },
        {
          expected: 50,
          steps: [0, 10, 0, 0, 10, 0, 10, 0, 0, 10, 0, 10, 0, 0],
          comment: "many variable gaps sum to 50",
        },
        {
          expected: 120,
          steps: [
            0,
            0,
            9,
            10,
            10,
            0,
            10,
            0,
            0,
            0,
            10,
            9,
            0,
            10,
            10,
            10,
            0,
            0,
            0,
            10,
            10,
            7,
            8,
            10,
            10,
            8,
            9,
            10,
          ],
          comment: "three active step groups with gaps",
        },
      ],
    );
  },
});

Deno.test({
  name: "test invalid active steps",
  fn: () => {
    testActiveSteps(
      [
        {
          expected: 0,
          steps: [10, 10, 0, 0, 0, 10, 10],
          comment: "too large of a gap with no steps",
        },
        {
          expected: 0,
          steps: [10, 10, 9, 9, 9, 10, 10],
          comment: "too large of a gap with less than required steps",
        },
      ],
    );
  },
});

Deno.test({
  name: "process steps into active groups",
  fn: () => {
    testProcessSteps([
      {
        expected: [[10, 10, 10]],
        steps: [10, 10, 10],
        comment: "one continuous active step groups",
      },
      {
        expected: [[10, 10, 10]],
        steps: [0, 10, 10, 10, 0],
        comment: "one continuous active step groups with zero padding",
      },
      {
        expected: [[10, 10, 10]],
        steps: [0, 0, 0, 10, 10, 10, 0, 0, 0, 0],
        comment: "one continuous active step groups with zero padding",
      },
      {
        expected: [[10, 10, 10]],
        steps: [10, 0, 10, 10],
        comment: "one active step groups with one one minute gap",
      },
      {
        expected: [[10, 10, 10]],
        steps: [0, 10, 0, 10, 0, 10, 0],
        comment: "one active step groups with many one minute gaps",
      },
      {
        expected: [[10, 10, 10]],
        steps: [10, 0, 0, 10, 10],
        comment: "one active step groups with one two minute gap",
      },
      {
        expected: [[10, 10, 10]],
        steps: [0, 0, 10, 0, 0, 10, 0, 0, 10, 0, 0],
        comment: "one active step groups with many two minute gap",
      },
      {
        expected: [[10, 10, 10], [10, 10, 10, 10]],
        steps: [10, 10, 10, 0, 0, 0, 10, 10, 10, 10],
        comment: "two continuous active step groups",
      },
      {
        expected: [[10, 10, 10], [10, 10, 10, 10]],
        steps: [10, 10, 10, 9, 9, 9, 10, 10, 10, 10],
        comment:
          "two continuous active step groups with almost valid steps in between",
      },
      {
        expected: [[10, 10, 10], [10, 10, 10, 10]],
        steps: [10, 10, 0, 10, 0, 0, 0, 10, 10, 10, 10],
        comment: "two active step groups with one gap",
      },
      {
        expected: [[10, 10, 10], [10, 10, 10, 10]],
        steps: [10, 10, 0, 10, 0, 0, 0, 10, 0, 0, 10, 10, 10],
        comment: "two active step groups with gaps",
      },
      {
        expected: [[10, 10, 10], [10, 10, 10, 10], [10, 10, 10, 10, 10]],
        steps: [
          0,
          0,
          9,
          10,
          10,
          0,
          10,
          0,
          0,
          0,
          10,
          9,
          0,
          10,
          10,
          10,
          0,
          0,
          0,
          10,
          10,
          7,
          8,
          10,
          10,
          8,
          9,
          10,
        ],
        comment: "three active step groups with gaps",
      },
    ]);
  },
});
