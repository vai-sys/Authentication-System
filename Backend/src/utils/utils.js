function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpHtml(otp) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Your One-Time Password (OTP) is:</p>
      
      <div style="
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 4px;
        margin: 20px 0;
        color: #2d89ef;
      ">
        ${otp}
      </div>

      <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>

      <hr style="margin: 20px 0;" />

      <p style="font-size: 12px; color: #888;">
        If you didn’t request this, you can ignore this email.
      </p>
    </div>
  `;
}

module.exports = {
  generateOTP,
  getOtpHtml
};