const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // create a transporter first
  var transporter = {};
  if (process.env.NODE_ENV === 'development') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: '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'
      }
    });
  }

  const mailOptions = {
    from: `Raja Aekant <${process.env.SENDGRID_REG_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;