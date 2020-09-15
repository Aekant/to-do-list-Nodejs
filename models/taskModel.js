const mongoose = require('mongoose');
const slugify = require('slugify');

// defining the schema for documents in our task collection
// 1st argument is for the document schema
// 2nd argument is config settings for virtual properties for example
// whether we want to show them in output 
const taskSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now()
  },
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
    validate: {
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
  toObject: { virtuals: true }
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
    return `${date.getUTCDate() - 1}:${date.getUTCHours()}:${date.getUTCMinutes()}`;
  } else {
    return 'XXXXXX';
  }
});

// creating a pre hook for taskSchema 
// Why we need this? Well we have to create a slug for the title
taskSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

// finally creating a model 
// this will create a collection in our database
// with the plural name of the model for example
// tasks collection for task model
// users collection for user model
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;