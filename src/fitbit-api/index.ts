/*
 * See Fitbit API documentation:
 * https://dev.fitbit.com/build/reference/web-api/activity/
 *
 * Also see my previous Fitbit Client for ABM:
 * https://github.com/robotpt/ros-abm-interaction/blob/master/src/abm_fitbit_client/__init__.py
 */

const INTRADAY_STEPS_KEY = "activities-steps-intraday";
const LAST_SYNC_KEY = "lastSyncTime";

export async function getIntradaySteps(accessToken: string, dateStr = "today") {
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

export async function getLastSync(accessToken: string) {
  const json = await fitbitRequest({
    requestUrl: `https://api.fitbit.com/1/user/-/devices.json`,
    accessToken,
  });
  if (json.length !== 1) {
    console.error(json);
    throw new Error(`There should be exactly one device, ${json.length} found`);
  }
  const device = json[0];
  if (!(LAST_SYNC_KEY in device)) {
    console.error(device);
    throw new Error("Didn't see last sync time in the returned data");
  }
  return device[LAST_SYNC_KEY] as Date;
}

export async function fitbitRequest(
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

export function intradayToArray(
  intradaySteps: { time: string; value: number }[],
) {
  const steps = intradaySteps.map((step) => step.value);
  return steps;
}
