import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // attendly.system@gmail.com
    pass: process.env.EMAIL_APP_PASSWORD // App Password from Google Account
  }
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('🔴 Mailer Connection Error:', error);
  } else {
    console.log('🟢 Mailer Service Ready to Send');
  }
});

app.post('/api/send-credentials', async (req, res) => {
  const { email, name, role, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mailOptions = {
    from: `"Attendly System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Attendly - Your Login Credentials',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Attendly</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">

  <!-- Main Container (No visible box, just max-width) -->
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="margin-bottom: 40px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #030712; letter-spacing: -0.5px;">Attendly<span style="color: #09D597;">.</span></h1>
    </div>

    <!-- Main Content -->
    <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Welcome, ${name}</h2>
    
    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      You have been invited to join the <strong>Attendly</strong> campus portal. An account has been created for you with the role of <strong>${role}</strong>.
    </p>

    <!-- Credentials Block (Simple gray background, no border) -->
    <div style="background-color: #f3f4f6; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 4px;">Email</div>
        <div style="font-size: 16px; font-weight: 500; font-family: monospace; color: #111827;">${email}</div>
      </div>
      <div>
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 4px;">Temporary Password</div>
        <div style="font-size: 16px; font-weight: 500; font-family: monospace; color: #111827;">${password}</div>
      </div>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 32px;">
      Please log in to the dashboard and set a new secure password.
    </p>

    <!-- Simple Button -->
    <a href="https://manageattendance.vercel.app/" style="display: inline-block; background-color: #030712; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">Login to Dashboard</a>

    <!-- FooterDivider -->
    <div style="height: 1px; background-color: #e5e7eb; margin: 48px 0 32px 0;"></div>

    <!-- Minimal Footer -->
    <p style="font-size: 13px; color: #9ca3af; margin: 0;">
      Sent by <strong>Attendly Academic Systems</strong>.<br>
      <a href="mailto:attendly.system@gmail.com" style="color: #6b7280; text-decoration: underline;">Contact Support</a>
    </p>
  </div>

</body>
</html>
`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    res.json({ success: true, message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/send-password-reset', async (req, res) => {
  const { email, name, resetLink } = req.body;

  if (!email || !resetLink) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mailOptions = {
    from: `"Attendly Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - Attendly',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">

  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <div style="margin-bottom: 40px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #030712; letter-spacing: -0.5px;">Attendly<span style="color: #09D597;">.</span></h1>
    </div>

    <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Reset Your Password</h2>
    
    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
      Hello ${name || 'User'},<br>
      We received a request to reset the password for your account. If you didn't ask for this, you can safely ignore this email.
    </p>

    <!-- Button -->
    <a href="${resetLink}" style="display: inline-block; background-color: #030712; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-bottom: 32px;">Reset Password</a>

    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 32px;">
      Or copy and paste this link into your browser:<br>
      <span style="font-family: monospace; color: #111827; word-break: break-all;">${resetLink}</span>
    </p>

    <div style="height: 1px; background-color: #e5e7eb; margin: 48px 0 32px 0;"></div>

    <p style="font-size: 13px; color: #9ca3af; margin: 0;">
      Link expires in 1 hour.<br>
      Sent by <strong>Attendly Security</strong>.
    </p>
  </div>

</body>
</html>
`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Reset email sent: %s', info.messageId);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending reset email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Mailer Service running on port ${PORT} `);
});

export default app;


