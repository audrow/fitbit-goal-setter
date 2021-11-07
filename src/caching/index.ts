import { ensureDir, exists, join, readCSVObjects, writeCSV } from "../deps.ts";
import type { intraDayStepsEntry } from "../fitbit-api/types.ts";
import {
  getDateRange,
  getDateString,
  getDayNumber,
  getWeekNumber,
} from "../utils/index.ts";
import { getIntradaySteps, intradayToArray } from "../fitbit-api/index.ts";
import { getActiveSteps } from "../active-steps/index.ts";
import type { ActiveStepsConfig } from "../active-steps/types.ts";
import type { Configuration } from "../config/types.ts";
import { getDayGoal, getWeekGoal } from "../goal-setting/index.ts";

export async function writeIntradayStepsToCsv(
  steps: { time: string; value: number }[],
  file: string,
) {
  const f = await Deno.open(file, { write: true, createNew: true });
  const header = ["time", "value"];
  const data = steps.map((d) => [d.time, d.value.toString()])
    .map((d) => Object.values(d));
  await writeCSV(f, [header, ...data]);
  f.close();
}

export async function readIntradayStepsFromCsv(file: string) {
  if (!await exists(file)) {
    return [];
  }
  const f = await Deno.open(file, { read: true });
  const data: intraDayStepsEntry[] = [];
  for await (const obj of readCSVObjects(f)) {
    const time = obj.time;
    const value = Number(obj.value);
    data.push({ time, value });
  }
  f.close();
  return data;
}

export async function writeDaySummaryToCsv(
  file: string,
  info: {
    date: Date;
    stepsGoal: number;
    activeSteps: number;
  },
) {
  const header = ["date", "steps goal", "active steps", "met goal"];
  const newData = [
    info.date.toLocaleDateString(),
    info.stepsGoal.toString(),
    info.activeSteps.toString(),
    (info.activeSteps >= info.stepsGoal).toString(),
  ];
  let data = [];
  const fileExists = await exists(file);
  if (fileExists) {
    const oldData = (await readDaySummaryFromCsvString(file));
    data = [...oldData, newData];
  } else {
    data = [newData];
  }
  const f = await Deno.open(file, { write: true, createNew: !fileExists });
  await writeCSV(f, [header, ...data]);
  f.close();
}

async function readDaySummaryFromCsvString(file: string) {
  if (!await exists(file)) {
    return [];
  }
  const f = await Deno.open(file, { read: true });
  const data = [];
  for await (const obj of readCSVObjects(f)) {
    data.push([
      obj["date"],
      obj["steps goal"],
      obj["active steps"],
      obj["met goal"],
    ]);
  }
  f.close();
  return data;
}

export async function readDaySummaryFromCsv(file: string) {
  const data = await readDaySummaryFromCsvString(file);
  return data.map((row) => {
    return {
      date: new Date(row[0]),
      stepsGoal: Number(row[1]),
      activeSteps: Number(row[2]),
      metGoal: row[3] === "true",
    };
  });
}

export async function pullIntradaySteps(
  startDate: Date,
  endDate: Date,
  deviceName: string,
  accessToken: string,
  isDebug: boolean,
) {
  const dates = getDateRange(startDate, endDate);
  dates.pop(); // remove the end date
  const dir = getIntradayStepsDir(deviceName);
  await ensureDir(dir);
  for (const date of dates) {
    const dateStr = getDateString(date);
    const file = join(dir, `${dateStr}.csv`);
    if (await exists(file)) {
      if (isDebug) {
        console.debug(
          `skipping ${dateStr} for '${deviceName}' because it already exists`,
        );
      }
    } else {
      console.debug(`saving data for ${dateStr} for '${deviceName}'`);
      const steps = await getIntradaySteps(accessToken, date);
      await writeIntradayStepsToCsv(steps, file);
    }
  }
}

function getDeviceDir(deviceName: string) {
  return join("data", deviceName);
}

function getIntradayStepsDir(deviceName: string) {
  return join(getDeviceDir(deviceName), "intraday-steps");
}

export async function getPreStudyActiveStepsFromFiles(
  startStudyDate: Date,
  startInterventionDate: Date,
  deviceName: string,
  activeStepsConfig: ActiveStepsConfig,
) {
  if (startStudyDate.getTime() >= startInterventionDate.getTime()) {
    throw new Error(
      `For device '${deviceName}', the study start date (${startStudyDate.toLocaleDateString()}) must be before the date to start the intervention (${startInterventionDate.toLocaleDateString()})`,
    );
  }
  if (isGreaterThanDate(startInterventionDate, new Date())) {
    throw new Error(
      `For device '${deviceName}', you are trying to look into the future since the pre study dates haven't finished`,
    );
  }
  return await getActiveStepsFromFiles(
    startStudyDate,
    startInterventionDate,
    deviceName,
    activeStepsConfig,
  );
}

async function getActiveStepsFromFiles(
  startDate: Date,
  endDate: Date,
  deviceName: string,
  activeStepsConfig: ActiveStepsConfig,
) {
  if (startDate.getTime() >= endDate.getTime()) {
    throw new Error(
      `For device '${deviceName}', the start date (${startDate.toLocaleDateString()}) must be before the end date (${endDate.toLocaleDateString()})`,
    );
  }
  if (isGreaterThanDate(endDate, new Date())) {
    throw new Error(
      `For device '${deviceName}', you are trying to look into the future with end date ${endDate.toLocaleDateString()}`,
    );
  }
  const dates = getDateRange(startDate, endDate);
  dates.pop(); // remove the last date, which is the startInterventionDate
  const data: { date: Date; activeSteps: number }[] = [];
  for (const date of dates) {
    data.push({
      date,
      activeSteps: await getActiveStepsFromFile(
        date,
        deviceName,
        activeStepsConfig,
      ),
    });
  }
  return data;
}

async function getActiveStepsFromFile(
  date: Date,
  deviceName: string,
  activeStepsConfig: ActiveStepsConfig,
) {
  const dir = getIntradayStepsDir(deviceName);
  const dateStr = getDateString(date);
  const file = join(dir, `${dateStr}.csv`);
  if (!await exists(file)) {
    throw new Error(
      `For device '${deviceName}', there is no data for ${dateStr}`,
    );
  }
  const steps = await readIntradayStepsFromCsv(file);
  const stepsArr = intradayToArray(steps);
  return getActiveSteps(stepsArr, activeStepsConfig);
}

function isLessThanDate(date1: Date, date2: Date) {
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);
  return date1.getTime() < date2.getTime();
}

function isGreaterThanDate(date1: Date, date2: Date) {
  return isLessThanDate(date2, date1);
}

type SummaryRecord = {
  date: Date;
  weekNum: number;
  dayNum: number;
  weeklyStepsGoal: number;
  dailyStepsGoal: number;
  activeStepsThisDay: number;
  activeStepsThisWeek: number;
  isMet: boolean;
};

export async function pullData(config: Configuration) {
  const deviceRecords: { [deviceName: string]: SummaryRecord[] } = {};

  for (const device of config.fitbit.devices) {
    const lastDayOfStudy = getLastDay(
      device.startInterventionDate,
      config.goalSetting.numOfWeeks,
    );

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (isGreaterThanDate(device.startStudyDate, currentDate)) {
      continue;
    }

    let endDate: Date;
    if (isLessThanDate(lastDayOfStudy, currentDate)) {
      endDate = new Date(lastDayOfStudy);
    } else {
      endDate = new Date(currentDate);
    }

    await pullIntradaySteps(
      device.startStudyDate,
      endDate,
      device.name,
      device.accessToken,
      config.fitbit.debug,
    );

    if (isGreaterThanDate(device.startInterventionDate, currentDate)) {
      continue;
    }

    const preStudyActiveSteps = await getPreStudyActiveStepsFromFiles(
      device.startStudyDate,
      device.startInterventionDate,
      device.name,
      config.activeSteps,
    );

    const preStudyMeanDailyActiveSteps = getMean(
      preStudyActiveSteps.map((d) => d.activeSteps),
    );
    const baseWeeklyStepsGoal = Math.max(
      preStudyMeanDailyActiveSteps * config.goalSetting.daily.daysPerWeek,
      config.goalSetting.weekly.minSteps,
    );

    const interventionDatesSoFar = getDateRange(
      device.startInterventionDate,
      endDate,
    );
    interventionDatesSoFar.pop(); // remove the last date, which is the endDate

    const records: SummaryRecord[] = [];
    if (interventionDatesSoFar.length === 0) {
      const date = new Date(device.startInterventionDate);
      const steps = await getIntradaySteps(device.accessToken, date);
      const stepsArr = intradayToArray(steps);
      const activeStepsSoFar = getActiveSteps(
        stepsArr,
        config.activeSteps,
      );

      const dayGoal = getDayGoal(
        baseWeeklyStepsGoal,
        0,
        date,
        date,
        config.goalSetting,
      );

      records.push({
        date: device.startInterventionDate,
        weekNum: 1,
        dayNum: 0,
        weeklyStepsGoal: baseWeeklyStepsGoal,
        dailyStepsGoal: dayGoal,
        activeStepsThisDay: activeStepsSoFar,
        activeStepsThisWeek: activeStepsSoFar,
        isMet: dayGoal <= activeStepsSoFar,
      });
    } else {
      const weekGoals: { [weekNum: number]: number } = {
        1: baseWeeklyStepsGoal,
      };
      const weekStepsRecord: { [weekNum: number]: number } = {};
      let weekSteps = 0;
      for (const date of interventionDatesSoFar) {
        const dayNum = getDayNumber(date, device.startInterventionDate);
        const weekNum = getWeekNumber(date, device.startInterventionDate);
        if (!(weekNum in weekGoals)) {
          const weekGoal = getWeekGoal(
            weekSteps,
            device.startInterventionDate,
            date,
            config.goalSetting,
          );
          weekGoals[weekNum] = weekGoal;
          weekStepsRecord[weekNum - 1] = weekSteps;
          weekSteps = 0;
        }
        const dailySteps = await getActiveStepsFromFile(
          date,
          device.name,
          config.activeSteps,
        );
        weekSteps += dailySteps;

        const dayGoal = getDayGoal(
          weekGoals[weekNum],
          weekSteps,
          device.startInterventionDate,
          date,
          config.goalSetting,
        );
        records.push({
          date,
          weekNum,
          dayNum,
          weeklyStepsGoal: weekGoals[weekNum],
          dailyStepsGoal: dayGoal,
          activeStepsThisDay: dailySteps,
          activeStepsThisWeek: weekSteps,
          isMet: dayGoal <= dailySteps,
        });
      }
      writeSummaryToCSV(
        device.name,
        records,
      );
    }
    deviceRecords[device.name] = records;
  }
  return deviceRecords;
}

async function writeSummaryToCSV(
  deviceName: string,
  records: SummaryRecord[],
) {
  const dir = getDeviceDir(deviceName);
  const file = join(dir, "summary.csv");
  const header = [
    "date",
    "weekNum",
    "dayNum",
    "weeklyStepsGoal",
    "dailyStepsGoal",
    "activeStepsThisDay",
    "activeStepsThisWeek",
    "isMet",
  ];
  const data = records.map((r) => {
    const arr = Object.values(r);
    return arr.map((v) => {
      if (v instanceof Date) {
        return v.toLocaleDateString();
      } else {
        return v.toString();
      }
    });
  });
  const f = await Deno.open(file, { write: true, create: true });
  await writeCSV(f, [header, ...data]);
  f.close();
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
export function getLastDay(startDate: Date, numOfWeeks: number) {
  return new Date(startDate.getTime() + MS_PER_DAY * numOfWeeks * 7);
}

function getMean(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export async function getStatus(config: Configuration) {
  const deviceStatus: {
    [deviceName: string]: {
      dayGoal: number;
      activeStepsSoFar: number;
      isMet: boolean;
    } | { comment: string };
  } = {};
  const deviceRecords = await pullData(config);
  for (const device of config.fitbit.devices) {
    const record = deviceRecords[device.name];
    const lastDayOfStudy = getLastDay(
      device.startInterventionDate,
      config.goalSetting.numOfWeeks,
    );
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (isGreaterThanDate(device.startStudyDate, currentDate)) {
      deviceStatus[device.name] = {
        comment:
          `Pre intervention period of getting steps baseline hasn't begun yet - it begins on ${device.startStudyDate.toLocaleDateString()}`,
      };
    } else if (isGreaterThanDate(device.startInterventionDate, currentDate)) {
      deviceStatus[device.name] = {
        comment:
          `Pre intervention period of getting steps baseline has began on ${device.startStudyDate.toLocaleDateString()} - the first day of the study is ${device.startInterventionDate.toLocaleDateString()}`,
      };
    } else if (currentDate.getTime() >= lastDayOfStudy.getTime()) {
      deviceStatus[device.name] = {
        comment:
          `Study with device ended on ${lastDayOfStudy.toLocaleDateString()}`,
      };
    } else {
      const lastRecord = record[record.length - 1];
      const lastWeekNum = lastRecord.weekNum;
      const lastWeekGoal = lastRecord.weeklyStepsGoal;
      const currentWeekNum = getWeekNumber(
        currentDate,
        device.startInterventionDate,
      );

      let weekGoal: number;
      if (currentWeekNum === lastWeekNum) {
        weekGoal = lastWeekGoal;
      } else {
        weekGoal = getWeekGoal(
          lastRecord.activeStepsThisWeek,
          device.startInterventionDate,
          currentDate,
          config.goalSetting,
        );
      }
      const dayGoal = getDayGoal(
        weekGoal,
        lastRecord.activeStepsThisWeek,
        device.startInterventionDate,
        currentDate,
        config.goalSetting,
      );
      const intradaySteps = await getIntradaySteps(
        device.accessToken,
        currentDate,
      );
      const intradayStepsArr = intradayToArray(intradaySteps);
      const activeSteps = getActiveSteps(
        intradayStepsArr,
        config.activeSteps,
      );
      deviceStatus[device.name] = {
        dayGoal,
        activeStepsSoFar: activeSteps,
        isMet: dayGoal <= activeSteps,
      };
    }
  }
  return deviceStatus;
}
