app status: the basic functionality is done, but I haven't spent time testing yet. docs and readme are out of date until enough testing is done 

Time management application. Assignments are shown in order of priority. Assignments with the nearest due date with the least amount of time logged are given the highest priority. Use the filter to see the assignment ranking order for tasks in specific courses, or all courses. Base use case has been to manage multiple assignments in multiple courses in university/college. The app can be used outside of this context by defining "assignments" as "tasks" and "courses" as "task categories."

## Instructions

1. Create database files: (a) create "db" directory in project root (b) create "assignments.json" inside db directory (c) create "courses.json" inside db directory

2. Install dependencies: run "npm install" in terminal from the project root directory

3. Run instructions: run "npm start" in terminal from the project root directory

## Resources

- [Detailed Roadmap](ROADMAP.md) for upcoming features and milestones.
- [Our Core Algorithm: Priority Ranking](https://github.com/dontbothercaffeinated/time_management/wiki/Our-Core-Algorithm:-Priority-Ranking) document detailing our core algorithm.
- [Our Cloud Backup Solution](https://github.com/dontbothercaffeinated/time_management/wiki/Cloud-Backup) for you to retain your progress through data-loss events.

## Detailed Overview

**What the Algorithm Does:**

The Automatic Priority Algorithm organizes your school assignments by buckets of time required. Each bucket is filled at a different pace. The pace is dictated by a priority ranking. You can think of the priority ranking of each assignment as an ultra-precise number provided to you to adjust the faucet strength for multiple hoses, each placed into a single bucket. These buckets don’t overfill though, but you get the point (hopefully.) The factors used to provide us (the software) the number are two key factors: how soon they're due and how much time you've already spent on them. Luckily, the system automatically adjusts the rate of liquid (time) that goes into the buckets. All you see is how full they are when you open the app. If you want to drain a bucket, you select it and start the timer. We pre-populated the amount of working time as 25 minutes, because it’s in line with the pomodoro technique. After you hit start on that set time, you can stop it at any moment (friends knocking on your door to get ready to party.) While you’re partying (technically right when you hit stop) we’ll drain the bucket for you for the amount of time you logged.

**How You Use the App:**

Using the app is straightforward. Simply activate the working timer on the assignments you’re working on and mark them as completed when finished. If you forget to stop the timer, the pre-set time will limit the impact. The app operates entirely on your device, eliminating the need for an internet connection or any additional costs. You can close the app and reopen it later, without impacting the flowing water (time) into your buckets. This makes it an easy, cost-effective, and flexible way for managing schoolwork.

**Keeping All Tasks in Mind:**

Top students often manage multiple assignments simultaneously to maintain a balanced workload. The rollover feature in the app ensures that even lower-priority tasks receive some attention. It doesn’t make sense to work on an assignment that requires 1 minute of work. Those minutes add up, though, and together, they give you enough time for a full study/work session. Our algorithm makes sure you’re putting in work before it turns into a major part of your day, but it’s realistic: it doesn’t make you put in a single minute of work on an assignment.

**How the Rollover Feature Helps:**

The rollover feature helps you manage low priority tasks with ones that demand most of your time. Think of two different assignment rankings: one requiring 45 minutes of work vs one requiring 2 minutes of work. Firstly, 2 minutes of work isn’t enough to open a book. Secondly, and most importantly, in around 22 days, that 2 minute assignment is going to require the same amount of daily work as the 45 minute assignment, albeit it won’t be required for another 22 days. The way this works in practice is more complex, though. Because assignment priorities are always shifting, you will see an increasing number of minutes being added to a bucket everyday, because (a) the weight of the total time left until the due date has an increasingly large weight in the “flow rate” calculation and (b) the priority based on total amount of time until the due date because increasingly significant as the due date approaches. This last sentence is just details, though.

**Relative Priority-Based Time Allocation:**

You don’t need to set any hard-to-estimate variables in our app. You just log time, and the application tells you how much time you’ll need to work. For example, the app, through the “bucket system,” will show you how much you need to work on a relative basis. You will see that one bucket is twice as full as the other. Not only is this visible, but you’ll see the exact numbers. These will help you understand relative amounts of time. To simplify, we’ve added time under these numbers. We do this through the following logic: if assignment 1 requires twice as much work as assignment 2 and you work 1 hour on assignment 1, you’ll need to work half an hour on assignment 2. Simple, but this allows for the app to be powerful: (a) you honestly don’t know how much time to spend on each task. You just know how much time to spend in comparison with your other tasks and assignments. (b) making this translation to time allows us to provide you a time estimate for all of your work. As we can derive complex reporting features from this setup, we’re going to provide more details when we release the features that are based on this core functionality.

**Automated Weighting Explained:**

As we described before, the rate of flow into each bucket is dictated by a number that is derived from two factors. One of the factors is the amount of time until the due date, the other is the amount of time we have worked on a task. Specifically, it’s the standardized version of those two values that is combined to create the number that is used. The closer our assignment gets to its due date, the higher the weight of the time until the due date factors into creating the number. Naturally, an assignment that is nearing a due date will have a top priority score if only the time until the due date is factored. As we near the due date, the time we spent working on the assignment means little to nothing. We just need to get it done. This is either an assignment that is nearing its due date that still hasn’t been marked as completed or it’s an upcoming quiz, test, or exam that we need to ace. In both cases, we tend to ignore everything else, and we put all our attention on these tasks. 

**Running Locally without Being Constantly Open:**

The app is designed to run entirely locally on your device, ensuring that all calculations and priority adjustments happen without needing the app to be open continuously. Adding, modifying, or deleting assignments, deleting courses, or logging new time on an assignment are all considered key events. Key events make changes in the database that come from user actions. All other updates are done automatically in the background. All other updates don’t require the application to be running to stay up to date. This lets you open the application after several days of not using it, and the buckets of time you see, as well as all the values associated with them, will be correct up to the second. 

**Limitations and Considerations:**

  - **Quality Assessment:** The algorithm does not evaluate the effectiveness of study sessions; users must ensure productive work.
  - **Dependence on Accurate Logging:** The algorithm is 100% dependent on you to select the assignment you are working on and you to start the working timer. You are required to use and pay attention to the countdown timer. 

