const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./public/uploads`);
  },
  filename: function (req, file, cb) {
    // since before uploading we have to log in the user 
    // therefore we have the userId on the req object
    // one user can have only one attachment for a given task thats why using 
    // userId as filename cuz if user uploads another attachment for the same task
    // it is going to replace the prev one

    // MIME type is as application/json or text/html or text/csv etc

    cb(null, `${req.user.id}-${file.fieldname}-${new Date().getTime()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage }).single('attachment');

// we just need to call this upload method in any middleware and it will extract the attachment
// and store it in the desginated folder with designated name
module.exports = upload;