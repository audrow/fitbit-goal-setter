# Direction

## 2021-10-22

My next steps are to start implementing the Fitbit commands. This means the
following:

- Getting current data
- Getting active steps
- Creating a goal
- Comparing if a user has reached their goal

Later, I will make it easier to generate reports using this interface. Perhaps I
can also make a command for runnning arbitrary Fitbit API commands.

With this being said, I will start on getting the current data and then getting
the active steps today.

### Result

Getting the intraday data works. I've also added a command to get the last sync.
Next I will be working to get the active steps.

To get the active steps, I will have to reference my previous implementation. I
also plan to make all of the parameters set from the config file.

Once I have the active steps, I will be able to work on goal setting.

I should also write tests for goal setting and calculating active steps. It may
be good to mock up the Fitbit interface and test my error handling in the
requests, although it seems to work fine, as long as their API doesn't change,
but my tests won't catch that; the system will just stop working.

## 2021-10-24

My next step is to get the active steps. To do this, I should look at my earlier
implementation. All of the parameters should be set from the config file,
instead of hard-coding the various files throughout the project.

After that, I will work on goal setting.

I think for both of these, I should test them, as I am writing them. This will
be a fun exercise.
