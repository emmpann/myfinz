import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  const info = await transporter.sendMail({
    from: '"MyFinz" <no-reply@efxn.cloud>',
    to: email,
    subject: 'Verifikasi Email Akun MyFinz Kamu',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verifikasi Akun Kamu</h2>
        <p>Silakan klik link berikut untuk memverifikasi akun kamu:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      </div>
    `,
  });

  console.log("Email verifikasi terkirim:", info.messageId);
}

export async function sendResetPasswordEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  const info = await transporter.sendMail({
    from: '"MyFinz" <no-reply@efxn.cloud>',
    to: email,
    subject: 'Reset Password Akun MyFinz',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Reset Password</h2>
        <p>Klik link di bawah ini untuk membuat password baru:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
    `,
  });

  console.log("Email reset password terkirim:", info.messageId);
}