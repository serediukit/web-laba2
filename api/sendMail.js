import { createTransport } from "nodemailer";
import sanitizeHtml from "sanitize-html";
require("dotenv").config();

function getTransporter() {
  return createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_ADRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

async function sendMail(options) {
    const transport = getTransporter();
    await transport.sendMail(options);
    return { success: true };
}
const from = `Valentyn Serediuk - ${process.env.EMAIL_ADRESS}`;
async function formSubmit(formData) {
  let html = "";
  for (const option in formData) {
    html += option + " : " + formData[option] + "<br/>";
  }
  return sendMail({
    from,
    to: process.env.EMAIL_TO_USER,
    subject: "New form submision",
    html: sanitizeHtml(html),
  });
}

const history = new Map();
const rateLimit = (ip, limit = 3) => {
  let hg = history.get(ip) || 0;
  if (hg++ > limit) {
    throw new CustomError("To many requests",429);
  }
  history.set(ip, hg);
};

const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameValid = /[a-zA-ZЁёА-я]+$/;

class CustomError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const validate = (body) => {
  const { email, name, password, confirmPassword } = body;
  if (!email || !name || !password || !confirmPassword) {
    throw new CustomError("One of the fields is empty", 204);
  }
  if (!emailValid.test(email)) {
    throw new CustomError("Incorrect Email", 400);
  }
  if (!nameValid.test(name)) {
    throw new CustomError("Incorrect name", 400);
  }
  if (password !== confirmPassword) {
    throw new CustomError("Password's are not similar", 400);
  }
};

module.exports = async (req, res) => {
  try {
    rateLimit(req.headers["x-real-ip"], 5);
    validate(req.body);
    const result = await formSubmit(req.body);
    res.json({ result });
  } catch (e) {
    const status = e.status || 500;
    const msg = e.message || "Error message";
    return res.status(status).json({
      status,
      errors: [msg],
      result: {
        success: false,
      },
    });
  }
};
