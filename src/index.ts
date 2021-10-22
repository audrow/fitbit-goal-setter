import { load as loadConfiguration } from "./config/index.ts";
import { makeParser } from "./cli/index.ts";
import type { Arguments } from "./deps.ts";

const printArgs = (args: Arguments) => {
  console.log(args);
};

const parser = makeParser({
  "list-devices": printArgs,
  "test-api-keys": printArgs,
  "goal-status": printArgs,
  "export": printArgs,
  "call-fitbit-api": printArgs,
});
// parser(Deno.args);
