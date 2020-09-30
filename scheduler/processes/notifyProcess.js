const async = require('async');

module.exports = async function (job) {
  try {
    const Task = require('./../../models/taskModel');
    const sendEmail = require('./../../utils/email');

    // if we use task.find() we will have to use query operators in the filter object
    // there is no such operator in query operator which can pull the dayOfMonth from date 
    // however aggregation pipeline do have such operators

    // $expr is used to enable us using raw aggregation expressions
    // dayOfYear extracts the day from  deadlines
    // using aggregation pipeline because .find() method does not accept these operators which enables
    // is to extract the necessary information
    const pendingTasks = await Task.aggregate([
      {
        $match: { $expr: { $and: [{ $eq: [{ $dayOfYear: '$deadline' }, { $dayOfYear: new Date() }] }, { $in: ['$status', ['NEW', 'IN-PROGRESS']] }] } }
      },
      // all tasks whose deadline is due today are extracted provided they are not OVERDUE, COMPLETED OR LATE-COMPLETED
      {
        $group: {
          _id: '$userId',
          tasks: { $push: '$$ROOT' }
        }
      },
      // after this we will have an array pendingTasks containing objects whose _id are user Ids, and these objects
      // have a field called tasks which is an array listing all the due tasks for that user today
      // $$ROOT is a system variable which references the top level document being processed in the aggregation pipe
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      // at this point we have done a populate query where the user Ids from the group stage are used to populate the
      // users. Why we need it? Well we need the email ids of users
      {
        $project: {
          '_id': 1,
          'tasks': 1,
          'email': '$user.email'
        }
      }
      // after the lookup stage the user field was an array which contained literally everything about the user. Here in
      // this stage we can turn ON or OFF properties or we can set new properties and so I did. I just need an email of 
      // user so I appended another field in it and set it equal to user.email from previous stage
    ]);
    // A single aggregation stage finds all the pending tasks for all the users for the given day and also finds their 
    // ids and emails

    // this method takes in an array to iterate over as a first argument
    // in the second argument it takes in a function which should be an async method either mark it async or it should
    // be one of those which takes callbacks inside it , this async function recieves an 
    // item from the list and a callback which is called with nothing when everything is right. or this callback can be 
    // called with an err which will trigger the third optional callback. The problem with calling it with an err is
    // that even if only a single email causes an err the processing of all emails will be stopped. Instead I will try 
    // to add a try catch block inside the iteratee so that the error related to a single email does not causes any
    // hinderance to the execution of other emails. 

    // The above comments talk about the usage as shown in the documentation but for my implementation I need to await
    // this process because when all emails are sent out I have to return Promise.resolve(). If I use the method as 
    // shown in documentation the promise.resolve() will run first before all emails are sent out
    // when no callback is specified it returns a promise which can be awaited
    await async.each(pendingTasks, async function (task) {
      try {

        // formatting the email
        let message = `You have the following tasks pending \n`;
        task.tasks.forEach((el, i) => message += (i + 1) + ') ' + el.title + `${el.description ? el.description + ': ' : ''}` + '\n');

        await sendEmail({
          email: task.email,
          message,
          subject: 'Pending tasks for today'
        });
      } catch (err) {
        console.log(`An error was caused while processing email ${task.email}`, err.message);
      }
    });

    // if we don't return anything then the event listeners won't trigger
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}