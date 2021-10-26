import { load as loadConfiguration } from "./config/index.ts";
import { makeParser } from "./cli/index.ts";
import type { Arguments } from "./deps.ts";
import {
  getIntradaySteps,
  getLastSync,
  intradayToArray,
} from "./fitbit-api/index.ts";
import { getActiveSteps } from "./active-steps/index.ts";
import type { ActiveStepsConfig } from "./active-steps/types.ts";

const config = await loadConfiguration();

const printArgs = (args: Arguments) => {
  console.log(args);
};

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

const getStatus = (args: Arguments) => {
  config.fitbit.devices.forEach(async (device) => {
    const activeSteps = await getActiveStepTotal(
      device.accessToken,
      args.date,
      config.fitbit.activeSteps,
    );
    const lastSyncTime = await getLastSync(device.accessToken);
    console.log(`\t* ${device.name} - ${activeSteps} steps - ${lastSyncTime}`);
  });
};

const parser = makeParser({
  "list-devices": listDevices,
  "test-api-keys": testApiKeys,
  "goal-status": getStatus,
  "export": printArgs,
  "call-fitbit-api": printArgs,
});
parser(Deno.args);
