

require('dotenv').config();
const nodemailer = require('nodemailer');
const config=require("../config/config")

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"AuthService" <${config.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log("Message sent:", info.messageId);

  } catch (error) {
    console.error("EMAIL ERROR FULL:", {
  message: error.message,
  response: error.response,
  stack: error.stack
});
  }
};


transporter.verify((err, success) => {
  if (err) {
    console.error("Transporter failed:", err);
  } else {
    console.log("Transporter ready");
  }
});


module.exports = {
sendEmail
};