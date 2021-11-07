# README

The code in this repository helps with setting walking goals using a Fitbit
device. Data obtained from the Fitbit API is downloaded to a folder called
`data`; once downloaded, the data is used to count how many active steps the
user has done each day and to set daily and weekly active step goals.

This project uses [Deno](https://deno.land/) and
[TypeScript](https://www.typescriptlang.org/).

## Setup

1. Install [Deno](https://deno.land/). You can find install instructions on
   Deno's website or try the commands below.
   ```bash
   # For ubuntu/mac
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```
   ```bash
   # For windows (using PowerShell)
   iwr https://deno.land/x/install/install.ps1 -useb | iex
   ```
1. Open a terminal (Windows PowerShell on Windows), create a directory where you
   want, and go into it. The directory can be called whatever you want. In the
   following commands, we create a directory called `fitbit`, but you could use
   anything else.
   ```bash
   mkdir fitbit
   cd fitbit
   ```
   Not that you will return to this directory anytime you run the commands
   below.
1. Next let's make an executable for the program on your computer.
   ```bash
   deno install --allow-read --allow-write --allow-net --reload https://raw.githubusercontent.com/audrow/fitbit-goal-setter/deploy/build/fitbit-goal-setter.js
   ```
   Now you have my program!

   Note that you can uninstall the program by running the following command:
   ```bash
   # For ubuntu/mac
   deno uninstall fitbit-goal-setter
   ```
   ```bash
   # For windows
   deno uninstall fitbit-goal-setter.cmd
   ```

   You can test that the program works by running
   ```bash
   # For ubuntu/mac
   fitbit-goal-setter --help
   ```
   ```bash
   # For windows
   fitbit-goal-setter.cmd --help
   ```
   which will output something like the following:
   ```bash
   deno run <command>

   Commands:
     deno run list-devices                  List all devices
     deno run test-api-keys                 Test API keys
     deno run goal-status                   Get goal status
     deno run pull-data                     Pull data from the Fitbit API
     deno run call-fitbit-api <request>     Make your own call to the fitbit API fo
                                           r all devices
     deno run make-config-file [--minimal]  Make a config file. This doesn't overwr
                                           ite existing config files, so if you wa
                                           nt to make another config file, delete
                                           or rename the existing one.

   Options:
     -h, --help     Show help                                             [boolean]
     -v, --version  Show version number                                   [boolean]
   ```
   Note that each command begins with `deno run <command>`, this is a quirk of
   the library that I'm using for the command line interface. It should say
   `fitbit-goal-setter.cmd <command>` on Windows and
   `fitbit-goal-setter <command>` on Linux/macOS.

   Also, note that we haven't set up our config file, so you won't be able to
   run most of the commands yet.

1. Now let's create a configuration file. This is how you'll set various aspects
   of the system up, such as how you define active steps, the Fitbit API
   credentials, the study and intervention dates, etc.
   ```bash
   # For ubuntu/mac
   fitbit-goal-setter make-config-file
   ```
   ```bash
   # For windows
   fitbit-goal-setter.cmd make-config-file
   ```
   You should see the following output:
   ```bash
   Created config file: config.yaml
   ```
1. Now we need to edit the configuration file. You can open the file in any text
   editor, for example on Windows you can use Notepad. Note that the config file
   will look better in a code editor, like
   [Visual Studio Code](https://code.visualstudio.com/).
   ```bash
   # For windows
   notepad.exe .\config.yaml
   ```
   The config file has several comments in it, which are lines that start with
   #. The comments are intended to help you understand how to use the config
   file. If you don't like the comments, you can delete the config file and then
   run the command again with the `--minimal` option.
   ```bash
   # For ubuntu/mac
   # rm ./config.yaml # remove the config file
   fitbit-goal-setter make-config-file --minimal
   ```
   ```bash
   # For windows
   # rm .\config.yaml # remove the config file
   fitbit-goal-setter.cmd make-config-file --minimal
   ```

   The main thing is that you must have at least one Fitbit device setup. This
   requires you to define study and intervention start dates, as well as to get
   an access token for each Fitbit device that you plan to use. For instructions
   on getting an access token from Fitbit, see
   [here](./docs/getting-fitbit-access-token.md).

1. Once you have the configuration file setup, you can check the API keys to see
   if they are correct before proceeding. This command will check if you're able
   to connect to the Fitbit API at all and if you have access to the intraday
   steps. Both of these checks are necessary before you can run the rest of the
   commands.
   ```bash
   # For ubuntu/mac
   fitbit-goal-setter test-api-keys
   ```
   ```bash
   # For windows
   fitbit-goal-setter.cmd test-api-keys
   ```
   If this was not successful, make sure that you're using the right access
   token and that you have the right permissions to access the Fitbit intra
   process data. Make sure you've done everything correct in
   [this page](./docs/getting-fitbit-access-token.md).

Now you're setup! The main command that you'll be using is `goal-status`, which
prints information on the status of all devices in the configuration file.

```bash
# For ubuntu/mac
fitbit-goal-setter goal-status
```

```bash
# For windows
fitbit-goal-setter.cmd goal-status
```

All of the data generated from the Fitbit API as well as a summary of each days
results is stored in a folder called `data` that will be created for you when
you run `goal-status` or `pull-data` (`pull-data` is run automatically when you
run `goal-status`). To see the generated data folder, run the command `ls`.

## Commands

### make-config-file

Makes a dummy configuration file for you. You can then modify the dummy
configuration file to your own liking and add your own Fitbit devices.

### goal-status

This gets the status of all devices in the configuration file. It will also list
information about each device and its current state in the study.

This command also pulls data from the Fitbit API and stores it in a folder
called `data`.

### pull-data

This command is implicitly run when you run `goal-status`. It pulls data from
the Fitbit API and stores it in a folder called `data`. It will also create a
summary of the data in a file called `summary.csv`.

### list-devices

This commands lists the devices in the config file. For more detail, see the
config file.

### test-api-keys

This command performs two checks:

1. It checks if it can communicate with the Fitbit API at all.
2. It checks if it can access the intraday steps data.

Both of these are necessary for this program to work. If the first check fails,
you likely haven't obtained your Fitbit API key correctly. If the second check
fails, you likely didn't create the application on Fitbit's site with the
correct permissions. You can either select the application as a personal
application, or get explicit permission from Fitbit to access the intraday data.

### call-fitbit-api

This command lets you run an arbitrary request to the Fitbit API. It will run
the command and print the output to the console. For example, you can use this
command to get the last sync information with the Fitbit request URL:
`https://api.fitbit.com/1/user/-/devices.json` and you will get something like
the following:

```
Device: My Fitbit Device
[
  {
    battery: "Medium",
    batteryLevel: 60,
    deviceVersion: "Alta HR",
    features: [],
    id: "554003533",
    lastSyncTime: "2021-11-06T08:53:36.000",
    mac: "AA3A580A09C9",
    type: "TRACKER"
  }
]
```

## FAQ

### Why can I not connect to the Fitbit API?

Make sure you have gotten the API keys correctly. You may want to retry the
steps in [getting the Fitbit access token](./getting-fitbit-access-tokens.md).

### I'm not able to access intraday steps?

Make sure that your Fitbit application is setup correctly. Double check that in
creating your application on Fitbit that you have the correct permissions for
intraday steps data. This can be through selecting a "personal" application type
or from getting explicit permission from Fitbit to use your app with intraday
steps data. See
[getting the Fitbit access token](./getting-fitbit-access-tokens.md) for more
information.

### The program was working and now has stopped working, what happened?

It's likely that you have exceeded Fitbit's call request limit. They let
personal applications have up to 150 requests in an hour. If you have exceeded
this limit, you will need to wait until the next hour to make another request.
If this is the case, here is an example of the error you'll be seeing in
console.

```
Response {
  body: ReadableStream { locked: false },
  bodyUsed: false,
  headers: Headers {
  "cf-cache-status": "DYNAMIC",
  "cf-ray": "6a7e4a5c1fb92530-SJC",
  connection: "keep-alive",
  "content-length": "99",
  "content-type": "application/json",
  date: "Tue, 02 Nov 2021 15:10:34 GMT",
  "expect-ct": 'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
  "fitbit-rate-limit-limit": "150",
  "fitbit-rate-limit-remaining": "0",
  "fitbit-rate-limit-reset": "2966",
  "retry-after": "2966",
  server: "cloudflare",
  via: "1.1 google",
  "x-frame-options": "SAMEORIGIN",
  "x-gateway-error": "ABOVE_RATE_LIMIT"
},
  ok: false,
  redirected: false,
  status: 429,
  statusText: "Too Many Requests",
  url: "https://api.fitbit.com/1/user/-/activities/steps/date/2021-11-02/1d.json"
}
error: Uncaught (in promise) Error: Trouble connecting to Fitbit - make sure your credentials are correct: status 429
    throw new Error(
          ^
    at fitbitRequest (file:///Users/audrow/Code/fitbit-script/src/fitbit-api/index.ts:77:11)
    at async getIntradaySteps (file:///Users/audrow/Code/fitbit-script/src/fitbit-api/index.ts:19:16)
    at async getStatus (file:///Users/audrow/Code/fitbit-script/src/caching/index.ts:417:29)
    at async file:///Users/audrow/Code/fitbit-script/src/caching/index.ts:439:13
```

The most important part of the error to look for is
`statusText: "Too Many Requests"`, which tells you that you've exceeded the
number of requests you can make in an hour.

It is also possible that a token you were using expired, although not likely if
you followed the instructions in
[getting the Fitbit access token](./getting-fitbit-access-tokens.md), since we
set the token to expire after one year. In this case, follow the instructions
again to get a new token.

### Can you add a feature?

Probably, just make an issue or send me an email, and we can discuss it.

### I found a bug. How do I report it?

You can email me, or better yet, create an issue on
[GitHub](https://github.com/audrow/fitbit-goal-setter/issues/new) (my
preference). In either case, be sure to tell me what is going on and try to tell
me how to reproduce it.
