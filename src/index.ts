import { load as loadConfiguration } from "./config/index.ts";
import { makeParser } from "./cli/index.ts";
import type { Arguments } from "./deps.ts";
import {
  fitbitRequest,
  getIntradaySteps,
  getLastSync,
  intradayToArray,
} from "./fitbit-api/index.ts";
import { getActiveSteps } from "./active-steps/index.ts";
import type { ActiveStepsConfig } from "./active-steps/types.ts";
import { getStatus, pullData } from "./caching/index.ts";

const config = await loadConfiguration();

const listDevices = (_args: Arguments) => {
  console.log("Devices\n-------");
  config.fitbit.devices.forEach((device) => {
    console.log(`\t* ${device.name}`);
  });
  console.log("\nGo into your config file to adjust devices");
};

const testApiKeys = async (args: Arguments) => {
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
        config.fitbit.activeSteps,
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

const pullDataCallback = (_args: Arguments) => {
  console.log("Pulling data...\n");
  pullData(config);
};

const getStatusCallback = async (_args: Arguments) => {
  const status = await getStatus(config);
  for (const device of config.fitbit.devices) {
    const deviceStatus = status[device.name];
    let message = `
Device: ${device.name}`;
    if ("comment" in deviceStatus) {
      message += `
  Comment: ${deviceStatus.comment}`;
    } else {
      message += `
  ${deviceStatus.isMet ? "HAS MET DAILY GOAL" : "Haven't met daily goal yet"}
  Active Steps So Far: ${deviceStatus.activeStepsSoFar}
  Day goal: ${deviceStatus.dayGoal}`;
    }
    message += `
  Last Sync: ${await getLastSync(device.accessToken)}`;
    console.log(message);
  }
};

const callFitbitApi = async (args: Arguments) => {
  for (const device of config.fitbit.devices) {
    const response = await fitbitRequest({
      requestUrl: args.request,
      accessToken: device.accessToken,
    });
    console.log(`\nDevice: ${device.name}\n${response}`);
  }
};

const parser = makeParser({
  "list-devices": listDevices,
  "test-api-keys": testApiKeys,
  "goal-status": getStatusCallback,
  "pull-data": pullDataCallback,
  "call-fitbit-api": callFitbitApi,
});
parser(Deno.args);
