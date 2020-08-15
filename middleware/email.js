const config = require("config");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "omari.qais@gmail.com",
    clientId: config.get("OAuth2_CLIENT_ID"),
    clientSecret: config.get("OAuth2_CLIENT_SECRET"),
    refreshToken: config.get("OAuth2_REFRESH_TOKEN"),
    accessToken: config.get("OAuth2_ACCESS_TOKEN"),
  },
});

function getMailOptions(to, subject, text) {
  return {
    from: "Alumni Advisory <omari.qais@gmail.com>",
    to,
    subject,
    text,
  };
}

module.exports.transporter = transporter;
module.exports.getMailOptions = getMailOptions;
