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
   * This pulls the data into the data directory
   */
  "pull-data": (args: Arguments) => void;
  /*
   * Gives the following information:
   * - The current goal status
   * - The steps goal and the current number of steps
   * - The time that the user last synced their data
   *
   * It also pulls the data into the data directory
   */
  "goal-status": (args: Arguments) => void;
  /*
   * calls the fitbit API with your own command
   */
  "call-fitbit-api": (args: Arguments) => void;
  /*
   * Makes a base config file and does not overwrite existing config file
   */
  "make-config-file": (args: Arguments) => void;
}

export const makeParser = (callbacks: callbacks) => {
  // deno-lint-ignore no-explicit-any
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
        command: "pull-data",
        describe: "Pull data from the Fitbit API",
        handler: callbacks["pull-data"],
      })
      .command({
        command: "call-fitbit-api <request>",
        describe: "Make your own call to the fitbit API for all devices",
        handler: callbacks["call-fitbit-api"],
      })
      .command({
        command: "make-config-file [--minimal]",
        describe:
          "Make a config file. This doesn't overwrite existing config files, so if you want to make another config file, delete or rename the existing one.",
        // deno-lint-ignore no-explicit-any
        builder: (yargs: any) =>
          yargs.option("minimal", {
            default: false,
            describe: "Removes comments from the config file",
            type: "boolean",
          }),
        handler: callbacks["make-config-file"],
      })
      .alias("h", "help")
      .alias("v", "version")
      .strict()
      .demandCommand(1)
      .parse();
  };
};
