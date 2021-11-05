import { load as loadConfiguration } from "./config/index.ts";
import { makeParser } from "./cli/index.ts";
import { exists } from "./deps.ts";
import type { Arguments } from "./deps.ts";
import {
  fitbitRequest,
  getIntradaySteps,
  getLastSync,
  intradayToArray,
} from "./fitbit-api/index.ts";
import { getDayNumber } from "./utils/index.ts";
import { getActiveSteps } from "./active-steps/index.ts";
import type { ActiveStepsConfig } from "./active-steps/types.ts";
import { getLastDay, getStatus, pullData } from "./caching/index.ts";

const configFile = "config.yaml";

const loadConfig = async () => {
  try {
    return await loadConfiguration(configFile);
  } catch (e) {
    console.error(
      `No config file '${configFile}' found - you can use the 'make-config-file' command to make a starter config file\n`,
      e,
    );
    Deno.exit(1);
  }
};

const listDevices = async (_args: Arguments) => {
  console.log("Devices\n-------");
  const config = await loadConfig();
  config.fitbit.devices.forEach((device) => {
    console.log(`\t* ${device.name}`);
  });
  console.log("\nGo into your config file to adjust devices");
};

const testApiKeys = async (args: Arguments) => {
  const config = await loadConfig();
  console.log("Checking...\n");
  let isError = false;
  for (const device of config.fitbit.devices) {
    try {
      await getLastSync(device.accessToken);
    } catch (e) {
      console.error(`Failed to access device '${device.name}': ${e}`);
      isError = true;
      continue;
    }
    try {
      await getActiveStepTotal(
        device.accessToken,
        args.date,
        config.activeSteps,
      );
    } catch (e) {
      console.error(
        `Failed to access intra day steps data for device '${device.name}': ${e}`,
      );
      isError = true;
      continue;
    }
    console.log(
      `\t* Device '${device.name}' syncs and has access to intraday steps data`,
    );
  }
  if (isError) {
    console.error("\nPlease fix the errors above and try again");
  } else {
    console.log(
      "\nAll devices are syncing and have access to intraday steps data",
    );
  }
};

async function getActiveStepTotal(
  accessToken: string,
  dateStr = "today",
  config: ActiveStepsConfig,
) {
  const steps = await getIntradaySteps(accessToken, dateStr);
  const stepsArray = intradayToArray(steps);
  return getActiveSteps(stepsArray, config);
}

const pullDataCallback = async (_args: Arguments) => {
  const config = await loadConfig();
  console.log("Pulling data...");
  await pullData(config);
  console.log("Done!");
};

const getStatusCallback = async (_args: Arguments) => {
  console.log("Working...");

  const config = await loadConfig();

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const status = await getStatus(config);
  for (const device of config.fitbit.devices) {
    const deviceStatus = status[device.name];
    const dayNumber = getDayNumber(currentDate, device.startInterventionDate);
    let message = `
Device: ${device.name}`;
    if ("comment" in deviceStatus) {
      message += `
  Comment: ${deviceStatus.comment}`;
    } else {
      message += `
  ${deviceStatus.isMet ? "HAS MET DAILY GOAL" : "Haven't met daily goal yet"}
  Last sync: ${await getLastSync(device.accessToken)}
  Active Steps So Far: ${deviceStatus.activeStepsSoFar}
  Day goal: ${deviceStatus.dayGoal}
  Day number: ${dayNumber}
  Days remaining: ${7 * config.goalSetting.numOfWeeks - dayNumber}`;
    }
    message += `
  Study start: ${device.startStudyDate.toLocaleDateString()}
  Intervention start: ${device.startInterventionDate.toLocaleDateString()}
  Intervention end: ${
      getLastDay(device.startInterventionDate, config.goalSetting.numOfWeeks)
        .toLocaleDateString()
    }`;
    console.log(message);
  }
};

const callFitbitApi = async (args: Arguments) => {
  const config = await loadConfig();
  for (const device of config.fitbit.devices) {
    const response = await fitbitRequest({
      requestUrl: args.request,
      accessToken: device.accessToken,
    });
    console.log(`\nDevice: ${device.name}\n${response}`);
  }
};

const makeConfigFile = async (_args: Arguments) => {
  if (await exists(configFile)) {
    console.error(
      `Config file '${configFile}' already exists - please delete it first`,
    );
    Deno.exit(1);
  }
  const configMessage = `
# The configuration file for the fitbit-goal-setter tool. This file helps define many of the specifics
# of the behavior of this tool, such as what Fitbit devices should be used and how do we define active
# steps and calculate goals.
#
# This file is in YAML format, and can be edited using any text editor.
# Lines that start with # are comments and are ignored when the program reads the file.
# In other words, they are only for your information. Feel free to delete them once you
# feel like you understand this file.

# Settings that relate to the Fitbit API
fitbit:
  # A list of fitbit devices, as well as their name and start dates
  devices:
    # You can add multiple devices here
    - name: My Fitbit device 1 # change this to your device name
      # Follow the instructions to get a valid access token
      accessToken: exJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM0JNNzIiLCJzdWIiOiI1VllYNjkiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJhY3QgcnNldCBybG9jIHJ3ZWkgcmhyIHJudXQgcnBybyByc2xlIiwiZXhwIjoxNjY2MzY0NDU4LCJpYXQiOjE2MzQ4Mjg0NTh9.jgF4MYOQsUTj9AZdnUcFRTPh2MMZsWu6HThpRhGcqCg
      # Set the date that you want to begin measuring their activity data
      # Note the format is YYYY-MM-DDT07:00:00.000Z to use California's timezone
      startStudyDate: 2021-09-15T07:00:00.000Z
      # Set the date that you want to be getting goals for them
      startInterventionDate: 2021-09-24T07:00:00.000Z
    # You can add multiple devices here, but you'll need to change the name and accessToken
    # The Fitbit device below is commented out with the # characters - delete the # to use it
    # - name: My Fitbit device 2
    #  accessToken: exJlbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM0JNNzIiLCJzdWIiOiI1VllYNjkiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJhY3QgcnNldCBybG9jIHJ3ZWkgcmhyIHJudXQgcnBybyByc2xlIiwiZXhwIjoxNjY2MzY0NDU4LCJpYXQiOjE2MzQ4Mjg0NTh9.jgF4MYOQsUTj9AZdnUcFRTPh2MMZsWu6HThpRhGcqCg
    #  startStudyDate: 2021-09-15T07:00:00.000Z
    #  startInterventionDate: 2021-09-24T07:00:00.000Z
  # If debug is 'true', you will see print statements for each day's data that is pulled from Fitbit or if it
  # is skipped, because it is already saved in the 'data' folder
  debug: false
# Settings that apply to how active steps are calculated
activeSteps:
  # The minimum duration of active minutes before active steps are counted
  # If this value is 15, the participant must walk 15 or more minutes with more than a minimum number of steps
  minDuration: 15
  # The minimum number of steps in one minute for that minute to be counted as active
  minStepsPerMin: 60
  # The maximum gap in minutes allowed between minutes with active steps
  # For example if the participant walks actively for 13 minutes, then takes a 2 minute break at a cross walk,
  # and then walks another 2 active minutes, the participant will have 15 active minutes
  # If the participant stops for 3 minutes and the maxInactiveMin is set to 2, the participant will have 13 active minutes
  # and these 13 active minutes may not be counted towards their daily goal, depending on the value of minDuration
  maxInactiveMin: 2
# Setting that are used in the goal setting process
goalSetting:
  # Set the duration of the intervention in weeks - this goes from each devices startInterventionDate for the
  # specified number of weeks. Note that this doesn't include the dates included in between each devices startStudyDate
  # and startInterventionDate (not including the startInterventionDate), as these dates are used to get an idea of what
  # the first week of the intervention should use as an active steps goal.
  numOfWeeks: 6
  weekly:
    # The minimum active steps you would like to recommend in a week
    minSteps: 2000
    # The final goal of active steps in a week that you would like to work towards
    finalGoal: 10000
    # The minimum improvement in active steps you would like to recommend from their current number of steps
    # For example, they did 3000 active steps last week, the minimum number of steps recommended would be
    # 3300 = 3000 * 1.1
    minImprovementRatio: 1.1
  daily:
    # The number of days per week that you expect them to try to achieve their walking goal
    # For example, if this value is 5, they can take up to two days off a week and it will not affect
    # their goal recommendations
    daysPerWeek: 5
    # This number limits the number of steps that will be recommended for them on any given day
    # The reason is if they fall behind, they are not told to catchup all 10,000 steps on the last day
    # For example, if the maxImprovementRatio is set to 2.0 and they have walked 0 active steps this week
    # and have a goal of 10,000 steps, the minimum goal would be 2000 steps a day
    # the goal for the day will be 4000 = 2000 * 2.0
    maxImprovementRatio: 2.0
`;
  await Deno.writeTextFile(configFile, configMessage);
  console.log(`Created config file: ${configFile}`);
};

const parser = makeParser({
  "list-devices": listDevices,
  "test-api-keys": testApiKeys,
  "goal-status": getStatusCallback,
  "pull-data": pullDataCallback,
  "call-fitbit-api": callFitbitApi,
  "make-config-file": makeConfigFile,
});
parser(Deno.args);
