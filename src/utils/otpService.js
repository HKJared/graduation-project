// const axios = require('axios');
require("dotenv").config();
const { google } = require("googleapis");
const nodemailer = require("nodemailer");

function formatPhoneNumber(phoneNumber) {
  // Loại bỏ khoảng trắng thừa
  phoneNumber = phoneNumber.trim();

  // Kiểm tra nếu số đã bắt đầu bằng '84'
  if (phoneNumber.startsWith("84")) {
    return phoneNumber;
  }

  // Nếu số bắt đầu bằng '0', thay '0' thành '84'
  if (phoneNumber.startsWith("0")) {
    return "84" + phoneNumber.slice(1);
  }

  // Nếu số đã hợp lệ hoặc có format khác
  return phoneNumber;
}

function base64EncodeUnicode(str) {
  return Buffer.from(str, "utf-8").toString("base64");
}

// Thông tin xác thực OAuth 2.0
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// Thông tin xác thực dịch vụ gửi số điện thoại
const phoneVerificationAPIUrl = process.env.BLUSEA_PHONE_VERIFICATION_API_URL;
const apiUsername = process.env.BLUSEA_API_USERNAME;
const apiPassword = process.env.BLUSEA_API_PASSWORD;
const apiBrandname = process.env.BLUSEA_API_BRANDNAME;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Thiết lập refresh token
oAuth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

class OTPService {
  static async sendOtpToPhoneNumber(phoneNumber, otp, requestId) {
    const message = `Mã xác thực của bạn cho ShopKecho là ${otp}, vui lòng không cung cấp cho bất kỳ ai.`;

    // Format lại số điện thoại
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    if (typeof requestId == "number") {
      requestId = requestId.toString();
    }
    try {
      const response = await fetch(phoneVerificationAPIUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(apiUsername + ":" + apiPassword).toString("base64"), // Sử dụng Buffer thay vì btoa
        },
        body: JSON.stringify({
          mobile: formattedPhoneNumber,
          message: base64EncodeUnicode(message), // Mã hóa tin nhắn hỗ trợ Unicode
          serviceId: apiBrandname,
          commandCode: apiBrandname,
          messageType: "0",
          requestId: requestId,
          totalMsg: "1",
          msgIndex: "1",
          isMore: "0",
          contentType: "0",
        }),
      });
      // console.log(response)
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error verifying phone number:", error);
    }
  }

  // Hàm gửi email
  static async sendEmail(to, otp) {
    try {
      const accessToken = await oAuth2Client.getAccessToken();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL_USER,
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });

      const messageBody = `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.2;">
                    <div style="max-width: 600px; min-height: 300px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                        <h2 style="color: #296CCB;">Xin chào,</h2>
                        <p style="color: #666;">Mã xác thực Email của bạn cho ShopKecho là:</p>
                        <h3 style="color: #296CCB; background-color: #edf4ff; padding: 16px; text-align: center; border-radius: 5px; font-size: 24px;">${otp}</h3>
                        <p style="color: #666;">Có hiệu lực trong 15 phút. <strong>KHÔNG</strong> chia sẻ mã này với người khác.</p>
                        <p style="color: #666;">Hãy mua sắm cùng ShopKecho!</p>
                        <hr style="border: 0; border-top: 1px solid #ccc;">
                        <p style="font-size: 12px; color: #777;">Đây là email tự động. Vui lòng không trả lời email này.</p>
                    </div>
                </body>
            </html>
            `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: "Mã xác thực ShopKecho",
        html: messageBody,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log("Email đã gửi:", result);
      return result;
    } catch (error) {
      console.error("Lỗi khi gửi email:", error);
      throw error;
    }
  }

  // Hàm tạo OTP
  static async createOTP() {
    // Sinh mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
  }
}

module.exports = OTPService;
