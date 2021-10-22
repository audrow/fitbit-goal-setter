# DESIGN

## Features

- Get intraday steps from Fitbit
- Calculate active steps, as defined by ABM
- Make a goal for the user
- Check if the users steps have exceeded the goal
- Show goals / performance over the duration of the study
- Test if the API keys work
- Work with multiple Fitbit devices
- Export the full study for easy processing

## Considerations

- It would be great to make this deterministic, so that I do not need to keep a
  memory of the events
- It would be great to have a sort of caching behavior -> maybe saving to a
  temporary directory
