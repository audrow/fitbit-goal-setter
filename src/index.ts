import { load as loadConfiguration } from "./config/index.ts";
import { makeParser } from "./cli/index.ts"
import type { Arguments } from "./deps.ts"

const INTRADAY_STEPS_KEY = "activities-steps-intraday";

async function fitbitRequest(
  options: { requestUrl: string; accessToken: string },
) {
  const response = await fetch(
    options.requestUrl,
    {
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
      },
    },
  );

  if (!response.ok) {
    console.log(response);
    throw new Error(
      `Trouble connecting to Fitbit - make sure your credentials are correct: status ${response.status}`,
    );
  }
  const json = await response.json();
  return json;
}

async function getIntradaySteps(accessToken: string, dateStr = "today") {
  const json = await fitbitRequest({
    requestUrl:
      `https://api.fitbit.com/1/user/-/activities/steps/date/${dateStr}/1d.json`,
    accessToken,
  });
  if (!(INTRADAY_STEPS_KEY in json)) {
    console.log(json);
    throw new Error(
      `Didn't see intraday step data - make sure that the account you're using has access to intraday steps data`,
    );
  }
  console.log(
    json[INTRADAY_STEPS_KEY]["dataset"],
  );
}

async function main() {
  const config = await loadConfiguration("dev");
  config.fitbit.devices.forEach(async (device) => {
    console.log(device);
    console.log(device.accessToken);
    const accessToken = device.accessToken;
    await getIntradaySteps(accessToken);
    console.log(`${device.name} steps`);
  });
}

// await main();

const printArgs = (args: Arguments) => {
  console.log(args);
}

// processArgs(Deno.args)
const parser = makeParser({
  "list-devices": printArgs,
  "test-api-keys": printArgs,
  "goal-status": printArgs,
  "export": printArgs,
});
parser(Deno.args);