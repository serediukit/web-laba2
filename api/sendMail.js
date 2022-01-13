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
  try {
    const transport = getTransporter();
    await transport.sendMail(options);
    return { success: true };
  } catch (error) {
    throw new Error(error?.message);
  }
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
  if (!history.has(ip)) {
    history.set(ip, 0);
  }
  if (history.get(ip) > limit) {
    throw new Error();
  }
  history.set(ip, history.get(ip) + 1);
};

const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameValid = /[a-zA-ZЁёА-я]+$/;

const validate = (body) => {
  const { email, name, password, confirmPassword } = body;
  if (!email || !name || !password || !confirmPassword) {
    throw new Error();
  }
  if (!emailValid.test(email)) {
    throw new Error();
  }
  if (!nameValid.test(name)) {
    throw new Error();
  }
  if (password !== confirmPassword) {
    throw new Error();
  }
};

module.exports = async (req, res) => {
  try {
    rateLimit(req.headers["x-real-ip"], 5);
    validate(req.body);
    const result = await formSubmit(req.body);
    res.json({ result });
  } catch (e) {
    return res.status(e.status).json({
      status: e.status,
      errors: [e.message],
      result: {
        success: false,
      },
    });
  }
};
