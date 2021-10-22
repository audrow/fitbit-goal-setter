import { yargs } from "../deps.ts";
import type { Arguments } from "../deps.ts";

export interface callbacks {
  /*
   * Lists the devices in the config file
   */
  "list-devices": (args: Arguments) => void;
  /*
   * Tests the API keys in the config file by making a sample query
   * - Do device query - does API key work?
   * - Do intraday query - do they have access to intraday data?
   */
  "test-api-keys": (args: Arguments) => void;
  /*
   * Gives the following information:
   * - The current goal status
   * - The steps goal and the current number of steps
   * - The time that the user last synced their data
   */
  "goal-status": (args: Arguments) => void;
  /*
   * Exports the following files
   * - Intraday steps for each Fitbit
   * - Active steps for each Fitbit in time series
   * - Goals and total steps for each Fitbit + (additional step of if actual steps >= goal for the day)
   */
  "export": (args: Arguments) => void;
  /*
   * Makes an arbitrary request to the Fitbit API and returns the response.
   * This should have an option to save the response to a file.
   */
  "call-fitbit-api": (args: Arguments) => void;
}

export const makeParser = (callbacks: callbacks) => {
  return (args: any) => {
    return yargs(args)
      .command({
        command: "list-devices",
        describe: "List all devices",
        handler: callbacks["list-devices"],
      })
      .command({
        command: "test-api-keys",
        describe: "Test API keys",
        handler: callbacks["test-api-keys"],
      })
      .command({
        command: "goal-status",
        describe: "Get goal status",
        handler: callbacks["goal-status"],
      })
      .command({
        command: "export",
        describe: "Export data",
        handler: callbacks["export"],
      })
      .alias("h", "help")
      .alias("v", "version")
      .strict()
      .demandCommand(1)
      .parse();
  };
};
