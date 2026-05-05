// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// async function sendMail({ to, subject, text, html }) {
//   const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
//   const msg = { from, to, subject, text, html };
//   return transporter.sendMail(msg);
// }

// async function sendOtpEmail(to, otp) {
//   const subject = 'Your CutPro verification code';
//   const text = `Your CutPro OTP is: ${otp}. It expires shortly.`;
//   const html = `<p>Your CutPro OTP is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`;
//   return sendMail({ to, subject, text, html });
// }

// module.exports = { sendMail, sendOtpEmail };



const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, otp) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: 'Your OTP Code',
      html: `<p>Your OTP is <b>${otp}</b></p>`
    });

    console.log("OTP sent via Resend to:", to);

  } catch (err) {
    console.error("Resend error:", err);
    throw err;
  }
};

module.exports = sendEmail;