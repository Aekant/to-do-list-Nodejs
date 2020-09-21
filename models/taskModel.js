const mongoose = require('mongoose');
const slugify = require('slugify');
const taskQueue = require('./../scheduler/queues/taskQueue');

// defining the schema for documents in our task collection
// 1st argument is for the document schema
// 2nd argument is config settings for virtual properties for example
// whether we want to show them in output 
const taskSchema = new mongoose.Schema({
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['NEW', 'IN-PROGRESS', 'COMPLETED', 'LATE-COMPLETION', 'OVERDUE'],
    default: 'NEW'
  },
  recentViewActivity: [Date],
  deadline: {
    type: Date,
    required: [true, 'A deadline for the task must be specified'],
    // Using a custom validator to make sure the deadline is 1 min
    // greater than creation time at the time of creation
    // and should be 1 min long at the time of updating

    // these validators run before the pre save hooks
    validate: {
      // this has access to the current document using this only when the document is being 
      // created
      validator: function (input) {
        if (new Date(input).getTime() > (Date.now() + 60000)) {
          return true;
        } else {
          return false;
        }
      },
      message: 'Deadline should be at least 1 min long'
    }
  },
  title: {
    type: String,
    required: [true, 'A title for the task is required'],
    maxlength: [40, 'A title cannot be longer than 40 characters'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  slug: String,
  // parent referencing 
  // adding id of user who will create this task
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: { createdAt: true, updatedAt: false }
});

// defining virtual properties on the schema
// virtual properties are not stored in the documents
// therefore we cannot query documents by virtual properties
// they are calculated form the properties of the documents when we query them
// the callback function has access to the document using the this keyword
taskSchema.virtual('dueTime').get(function () {
  let diff = this.deadline.getTime() - Date.now();
  if (this.status === 'COMPLETED' || this.status === 'LATE-COMPLETION') {
    return '------';
  } else if (diff > 0) {
    let date = new Date(diff);
    return `${date.getUTCDate() - 1} days:${date.getUTCHours()} Hours:${date.getUTCMinutes()} Minutes`;
  } else {
    return 'XXXXXX';
  }
});

// creating a pre hook for taskSchema 
// Why we need this? Well we have to create a slug for the title
// this wont run if we are doing findByIdAndUpdate, althought the validators
// can be run if we want by setting the option runValidators to true
taskSchema.pre('save', function (next) {
  if (!this.isModified('title')) return next();
  this.slug = slugify(this.title, { lower: true });
  next();
});

// to check before document saving that if our document is not new and its status field
// got modified which is either IN-PROGRESS or COMPLETED, so if doc is not new and status 
// got modified to completed then run this
taskSchema.pre('save', async function (next) {
  if (this.isNew || !this.isModified('status') || this.status !== 'COMPLETED') {
    return next();
  }

  let diff = this.deadline.getTime() - Date.now();
  // if the status is changed to COMPLETED and it is overdue then mark it as LATE-COMPLETION
  if (diff < 0) {
    this.status = 'LATE-COMPLETION';
  } else {
    // Or else if it is completed on time then simply keep it COMPLETED and remove the job from queue
    const job = await taskQueue.getJob(this.id);
    if (job) {
      job.remove();
    }
  }
  this.completedAt = new Date();
  next();
});

taskSchema.pre('save', function (next) {
  // to be used in post hook because apparently if the document is new in pre hook it is not new in 
  // post hook
  this.wasNew = this.isNew;
  next();
});

// if the deadline is changed we need to dequeue the previous scheduled job and queue a new one
taskSchema.pre('save', async function (next) {
  // before this pre hook it is validated that the deadline is not less than the current time.
  // in the schema validators it is ensured that if the deadline is changed then it can be increased only
  if (!this.isNew && this.isModified('deadline')) {
    // obviously if we are in this pre hook this mean that the deadline is greater than current time
    // it could happen that our status was set to OVERDUE so we need to set the status to IN-PROGRESS
    // or if it was late completion then it would be completed
    if (this.status === 'LATE-COMPLETION') {
      this.status = 'COMPLETED';
      // no need to reschedule job here
      next();
    } else if (this.status !== 'COMPLETED') {
      // it could be NEW, IN-PROGRESS or OVERDUE, in either case the task needs to be rescheduled
      const job = await taskQueue.getJob(this.id);
      if (job) {
        job.remove();
      }
      // creates a new job
      taskQueue.add({ taskId: this.id }, { delay: this.deadline.getTime() - this.createdAt.getTime(), jobId: this.id });
      console.log(this.deadline.getTime() - this.createdAt.getTime());
      // now if status was OVERDUE then it should be IN-PROGRESS
      if (this.status === 'OVERDUE') {
        this.status = 'IN-PROGRESS';
      }
      next();
    }
  }
  next();
});

// after document creation
taskSchema.post('save', function (doc, next) {
  // now there is a trade off, we want to save the jobId on the doc, then we have to create a job in pre save hook
  // but that way we cant have access to taskId since it is not saved so a work around is to do it in post save 
  // hook so that we have taskId and what about jobId? Well we wont store a job Id on tasks. The job Id will just be the
  // taskId
  if (!doc.wasNew) {
    return next();
  }
  // this adds a job in the task queue everytime a task is created
  // well repeat option and custom job id together are not supported therefore using delay
  taskQueue.add({ taskId: doc.id }, { delay: doc.deadline.getTime() - doc.createdAt.getTime(), jobId: doc.id });
  console.log(doc.deadline.getTime() - doc.createdAt.getTime());
  next();
});

taskSchema.post('findOneAndDelete', async function (doc) {
  // if there is a job by that id find that and remove
  const job = await taskQueue.getJob(doc.id);
  if (job) {
    job.remove();
  }
});

// finally creating a model 
// this will create a collection in our database
// with the plural name of the model for example
// tasks collection for task model
// users collection for user model
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;