const mongoose = require('mongoose');
const val = require('validator');
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: [4, 'A username must be at least 4 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    unique: [true, 'Username already exists']
  },
  password: {
    type: String,
    required: true,
    minlength: [12, 'Password must be at least 12 characters long'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function (inp) {
        return inp === this.password;
      },
      message: 'Passwords do not match'
    }
  },
  email: {
    type: String,
    required: [true, 'An email is required'],
    lowercase: true,
    validate: { validator: val.isEmail, message: 'Enter a valid email' }
  },
  photo: String
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// defining an instance method
userSchema.methods.correctPassword = async function (candidatePass, hashedPass) {
  // this.password is not accessible
  return await bcrypt.compare(candidatePass, hashedPass);
}
const User = mongoose.model('User', userSchema);

module.exports = User;