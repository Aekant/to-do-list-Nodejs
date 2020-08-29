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
    required: [true, 'A deadline for the task must be specified']
  },
  title: {
    type: String,
    required: [true, 'A title for the task is required'],
    maxlength: [40, 'A title cannot be longer than 40 characters'],
    unique: true
  },
  description: String,
  slug: String
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// defining virtual properties on the schema
// virtual properties are not stored in the documents
// therefore we cannot query documents by virtual properties
// they are calculated form the properties of the documents when we query them
taskSchema.virtual('dueTime').get(function () {
  let diff = this.deadline.getTime() - Date.now();
  if (diff > 0) {
    let date = new Date(diff);
    return `${date.getUTCDate() - 1}:${date.getUTCHours()}:${date.getUTCMinutes()}`;
  } else {
    return '------';
  }
});

// creating a pre hook for taskSchema 
// Why we need this? Well we have to create a slug for the title
taskSchema.pre('save', function () {
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