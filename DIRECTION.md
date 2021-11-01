# Direction

## 2021-10-22

My next steps are to start implementing the Fitbit commands. This means the
following:

- Getting current data
- Getting active steps
- Creating a goal
- Comparing if a user has reached their goal

Later, I will make it easier to generate reports using this interface. Perhaps I
can also make a command for running arbitrary Fitbit API commands.

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

### Results

Today, I have coded to get the active steps. I have also updated the command
line interface to run a few commands that use this interface, namely a command
to get status, check the API keys, and a command to list the devices. These work
well at the moment.

The next step is to calculate goals, given the active steps data. It is likely
that I should have a sort of caching system for this, so that I don't have to
repeatedly pull from the Fitbit API for each day, and so that the code is
faster. I will have to think of exactly how this works. Perhaps it can be, once
a day is pulled, it is stored somewhere. From there, I can also compute the
active steps and record the user's goal. This can be stored somewhere, too. It
will probably involve adding a notion of pulling data for every day between the
start of the study and the previous day. I will think more about this. Perhaps I
can make a pull command, as well, to pull down data for all previous days, we'll
see.

## 2021-10-25

Today, I will work on goal setting. It seems that the actual goal setting is
simple. It will probably be mostly a problem of caching the data.

### Results

I worked on writing the goal setting. I made and tested get weekly goal. I also
tested a function to get the week number. This is the opposite of get remaining
weeks, which I think is better design.

The next thing to do is tho test the weekly goal and then add the daily goal.
From there, I can worry about caching.

## 2021-10-26

Today, I will continue with goal setting. If all goes well, I may get to some of
the caching system.

I have just considered that I should use the previous week as a baseline for the
first steps goal.

### Results

I have got the goal setting working and I have tested it.

My next step is to create the data files and to use them in calculating active
steps, etc. I will have to think about how these are organized.

## 2021-10-27

Today I will work on daily goal setting. This should be a bit simpler than the
weekly case, but we'll see.

### Results

Today, I added a command to get the daily steps goals and tested it.

### Next steps

- Add caching
  - Fitbit data
  - Active steps & goal
- Tie everything together with the CLI
- Write documentation

## 2021-10-28

Today I will work on the caching system. I think that I will have to do a bit of
thinking about its structure.

### Results

I wrote a simple read and write to CSV file script and tested it. This required
a good bit of learning about Deno and the commands to do things on its file
system. Hopefully the rest of the caching system will be easier to implement.

## 2021-10-29

Today, I will hopefully finish the caching section.

### Results

I made progress adding a summary page for the general caching system. I didn't
finish testing it. That is my next step.

## 2021-10-30

### Results

Today I added a test for reading and writing to CSV summary files. I also added
code to get a date range. This will be useful to get the caching system pulling
all dates Fitbit data.

## 2021-11-01

Today I hope to finish up the caching system. This may be tricky as creating the
summary file involves computing many things in the correct order. For example, I
have to keep track of the goals and the total active steps.

## Results

I made good progress on the caching system. I almost have all of the data that I need. I just need to add the daily steps goals. Once I have that, I can save the output to a file. I think that I will generate it every time, that seems easier than reading the data in.

One challenge with my current architecture is that it is quite hard to test the higher level components. This is because I have made a functional approach and rely on the functions. I could pass in the functions as arguments. This motivates that I could have used classes and passed in those classes, aka injecting those dependencies. I doubt that I'll have time for this, since it is a larger architectural change.