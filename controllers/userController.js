const User = require('./../models/userModel');

module.exports.delete = async (req, res, next) => {
  // since this is a protected route the req object has a user property
  try {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
      message: 'Success',
      data: null
    });
  } catch (err) {
    res.status(404).json({
      message: 'Failed',
      error: err.message
    });
  }
}

module.exports.getAll = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      message: 'Success',
      total: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    res.status(404).json({
      message: 'Failed',
      error: err.message
    });
  }
}
