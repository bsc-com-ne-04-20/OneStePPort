import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Endpoint to handle form submission
app.post('/send-email', upload.single('file'), async (req, res) => {
  const { name, email, message } = req.body;
  const file = req.file;

  // Validate input fields
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required. Please try again!' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Main email options to send to your email
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `New Message from ${name}`,
      text: message,
      attachments: file
        ? [{ filename: file.originalname, path: file.path }]
        : [],
    };

    // Send main email
    await transporter.sendMail(mailOptions);

    // Auto-reply email options
    const autoReplyOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'We Have Received Your Message',
      text: `Dear ${name},\n\nThank you for reaching out. We have received your message and are reviewing it. You will receive a response shortly.\n\nBest regards,\nOneStepPort`,
    };

    // Send auto-reply email
    await transporter.sendMail(autoReplyOptions);

    // Clean up the uploaded file
    if (file) {
      fs.unlinkSync(file.path);
    }

    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ error: `Failed to send email: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
