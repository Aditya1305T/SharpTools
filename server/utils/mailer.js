const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, otp) => {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject: 'Your OTP Code',
    html: `<p>Your OTP is <b>${otp}</b></p>`
  });
};
console.log("RESEND KEY EXISTS:", !!process.env.RESEND_API_KEY);
console.log("Sending email to:", to);

module.exports = sendEmail;
