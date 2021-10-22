/*
 * See Fitbit API documentation:
 * https://dev.fitbit.com/build/reference/web-api/activity/
 */

import { load as loadConfiguration } from "../config/index.ts";

const INTRADAY_STEPS_KEY = "activities-steps-intraday";

async function getIntradaySteps(accessToken: string, dateStr = "today") {
  const json = await fitbitRequest({
    requestUrl:
      `https://api.fitbit.com/1/user/-/activities/steps/date/${dateStr}/1d.json`,
    accessToken,
  });
  if (!(INTRADAY_STEPS_KEY in json)) {
    console.error(json);
    throw new Error(
      "Didn't see intraday step data - " +
        "make sure that the account you're using has access to intraday steps data " +
        "and that the Fitbit request you're sending provides intraday steps data",
    );
  }
  return json[INTRADAY_STEPS_KEY]["dataset"];
}

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

async function main() {
  const config = await loadConfiguration("dev");
  config.fitbit.devices.forEach(async (device) => {
    // console.log(device);
    // console.log(device.accessToken);
    const accessToken = device.accessToken;
    console.log(await getIntradaySteps(accessToken));
    // console.log(`${device.name} steps`);
  });
}

await main();
