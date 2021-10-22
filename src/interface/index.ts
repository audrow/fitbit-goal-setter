import { yargs } from "../deps.ts"
import type { Arguments } from "../deps.ts"

export interface callbacks {
  "list-devices": (args: Arguments) => void,
  "test-api-keys": (args: Arguments) => void,
  "goal-status": (args: Arguments) => void,
  "export": (args: Arguments) => void,
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
      .parse()
  }
}
