const mongoose = require('mongoose');
const val = require('validator');
const bcrypt = require('bcryptjs')
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: [4, 'A username must be at least 4 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    unique: [true, 'Choose another username']
  },
  password: {
    type: String,
    required: function () {
      return this.provider === 'local';
    },
    minlength: [12, 'Password must be at least 12 characters long'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: function () {
      return this.provider === 'local';
    },
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
    validate: { validator: val.isEmail, message: 'Enter a valid email' },
    unique: [true, 'Email already exists']
  },
  photo: String,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  accountVerificationToken: String,
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    unique: true
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  verified: {
    type: Boolean,
    default: false,
    select: false
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: { createdAt: true, updatedAt: false }
});

userSchema.pre('save', async function (next) {
  // if the provider is local then ok otherwise we dont want to run this
  // pre hook cuz we dont have passwords after all
  if (this.provider !== 'local') return next();
  // we dont want to run this hook if the password isnt changed at all
  // we might have updated some other property and then saved the doc
  // that would trigger this hook regardless of the fact that pass
  // changed or not so we check if the pass was changed (?)
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  // only for local signed up users
  if (this.provider !== 'local') return next();
  // if the password is not changed or if the document is newly created
  // we want to exit so
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = (Date.now() - 1000);
  next();
});

// defining a query middleware to filter out all the deactivated accounts
// and we cannot add a query here which checks all non verified accounts becasue when actually accessing the verifying 
// route we are actually finding tasks which are not verified, therefore the query where we sort out all the non 
// verified account is best suited for login route and forgot password route
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// defining an instance method
userSchema.methods.correctPassword = async function (candidatePass, hashedPass) {
  // this.password is not accessible
  return await bcrypt.compare(candidatePass, hashedPass);
}

userSchema.methods.verifyPasswordChange = async function (JWTTimeStamp) {
  // this field only exists if a password was changed after the user was 
  // created and if this exists we are going to continue with comparison
  // otherwise just return the default false response.
  if (this.passwordChangedAt) {
    return JWTTimeStamp < ((this.passwordChangedAt.getTime() / 1000) * 1);
  }

  // not changed
  return false;
}

userSchema.methods.createPasswordResetToken = async function () {
  //generates a random 32 character token which is converted to hex
  const resetToken = crypto.randomBytes(32).toString('hex');
  // use sha256 hashing, update from the resetToken variable
  // then store it as hexadecimal
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  // returns plain token too
  return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;