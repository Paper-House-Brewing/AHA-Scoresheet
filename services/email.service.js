const nodemailer = require("nodemailer");
const debug = require("debug")("bjcp-scoresheet:email.service");

class EmailService {
  constructor() {
    if (process.env.NODE_ENV !== "development") {
      (this.host = process.env.EMAIL_HOST),
        (this.port = process.env.EMAIL_PORT);
      this.secure = process.env.EMAIL_SECURE;
      this.user = process.env.EMAIL_USER;
      this.pass = process.env.EMAIL_PASSWORD;
      this.domain = process.env.DOMAIN;
    } else {
      this.testEnv = true;
      this.domain = "http://localhost:3000";
    }

    this.initialized = false;
    this.initialize();
  }

  async initialize() {
    const testAccount =
      process.env.NODE_ENV === "development"
        ? await nodemailer.createTestAccount()
        : null;

    this.transporter = nodemailer.createTransport({
      host: this.host || "smtp.ethereal.email",
      port: this.port || 587,
      secure: this.secure || false,
      auth: {
        user: this.user || testAccount.user,
        pass: this.pass || testAccount.pass,
      },
    });

    await this.transporter.verify().catch((err) => {
      debug(err);
    });

    this.initialized = true;
  }

  async waitForInitialization() {
    while (!this.initialized) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return true;
  }

  async sendUserVerificationEmail(recipient, emailVerificationCode) {
    await this.waitForInitialization();

    const mailInfo = await this.transporter
      .sendMail({
        from: `"BJCP Scoresheets" <${this.user || "test@example.com"}>`,
        to: recipient,
        subject: "Verify BJCP-Scoresheets Email Address",
        text: `Please navigate to ${this.domain}/validate/?key=${emailVerificationCode} to validate your email address.`,
        html: this.generateHtmlMessage(
          "Verify your Email Address",
          "Please click the button below to verify your email address.",
          `${this.domain}/validate/?key=${emailVerificationCode}`,
          "Verify Email"
        ),
      })
      .catch((err) => {
        debug(err);
      });

    if (this.testEnv) {
      console.log(
        "Mail sent. View message here:",
        nodemailer.getTestMessageUrl(mailInfo)
      );
    }
  }

  async sendPasswordResetEmail(recipient, passwordResetCode) {
    await this.waitForInitialization();

    const mailInfo = await this.transporter
      .sendMail({
        from: `"BJCP Scoresheets" <${this.user || "test@example.com"}>`,
        to: recipient,
        subject: "Reset BJCP-Scoresheets Password",
        text: `Please navigate to ${this.domain}/resetpassword/?key=${passwordResetCode} to reset your password. If you did not request a password reset, please disregard this email.`,
        html: this.generateHtmlMessage(
          "Reset Your Password",
          "Please click the button below to reset your password. If you did not request a password reset, please disregard this email.",
          `${this.domain}/resetpassword/?key=${passwordResetCode}`,
          "Reset Password"
        ),
      })
      .catch((err) => {
        debug(err);
      });

    if (this.testEnv) {
      console.log(
        "Mail sent. View message here:",
        nodemailer.getTestMessageUrl(mailInfo)
      );
    }
  }

  generateHtmlMessage(header, content, buttonLink, buttonText) {
    return `
    <body>
      <table align="center" cellpadding="0" cellspacing="0" border="0" style="width:100% !important;"><tbody>
        <tr><td>
          <div style="margin-left: auto; margin-right: auto; margin-bottom: 50px; width: 250px;">
            <a href="${this.domain}" >
              <img src="${
                this.domain
              }/images/app-logo.png" alt="bjcp-scoresheets logo" style="width:250px;object-fit:contain;">
            </a>
          </div>
        </td></tr>
        <tr><td style="font-size: 27px; padding-bottom: 10px; text-align:center;">
          ${header}
        </td></tr>
        <tr><td style="font-size: 14px; padding-bottom: 20px; text-align:center;">
          ${content}
        </td></tr>
        <tr><td style="font-size: 14px; padding-bottom: 20px; text-align:center;">
          ${
            buttonLink
              ? `<a href="${buttonLink}" style="font: menu; text-decoration:none; display:inline-block; width: 115px; height: 25px; background: #4E9CAF; padding: 10px 10px 0px 10px; text-align: center; border-radius: 5px; color: white; font-weight: bold;">${
                  buttonText || "Go"
                }</a>`
              : ""
          }
        </td></tr>
        <tr><td>
          <div style="font-size: 10px; color: #aaa; text-align:center; margin-bottom: 10px; white-space: pre-wrap;">
            If the button does not work, copy and click this link or copy and paste it into your browser navigation bar: &#10;<a href="${buttonLink}">${buttonLink}</a>
          </div>
        <tr><td>
        <tr><td>
          <div style="font-size: 8px; color: #888; text-align:center;">
            This email was automatically generated by ${this.domain}. 
            If you no longer wish to recieve automated emails from ${
              this.domain
            }, please click 
            <span><a href="${
              this.domain
            }/unsubscribe">here</a></span> to unsubscribe from all communications.
          </div>
        </td></tr>
      </tbody></table>
    </body>
    `;
  }
}

const Email_Service = new EmailService();

module.exports = Email_Service;
