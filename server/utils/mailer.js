const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, otp) => {
  console.log("📧 Attempting to send OTP to:", to);
  console.log("🔑 RESEND KEY EXISTS:", !!process.env.RESEND_API_KEY);

  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: 'Your OTP Code',
      html: `<p>Your OTP is <b>${otp}</b></p>`
    });

    console.log("✅ Email sent successfully:", response);

  } catch (err) {
    console.error("❌ Failed to send OTP email:", err);
    throw err;
  }
};

module.exports = sendEmail;