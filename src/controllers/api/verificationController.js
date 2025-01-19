const VerificationModel = require('../../models/verificationModel');
const OTPService = require('../../utils/otpService');
const UserModel = require('../../models/userModel');

class VerificationController {
    // hàm tạo xác thực với số điện thoại
    static async createPhoneVerification(req, res) {
        try {
            const user_id = req.user_id || null;
            const log_id = req.log_id;

            const phone_number = req.body.phone_number;
            const otp_code = await OTPService.createOTP();

            const user = await UserModel.getUserByUsernameOrPhoneNumber(phone_number);
            if (user) {
                return res.status(400).json({ message: `Số điện thoại ${ phone_number } đã được đăng ký tài khoản.` })
            }

            const phone_verification_id = await VerificationModel.createPhoneVerification(phone_number, otp_code, user_id);

            // const invalidPhoneMessages = ['1', '5', '53', '531'];
            // const response = await OTPService.sendOtpToPhoneNumber(phone_number, otp_code, phone_verification_id);
            // // console.log(response)
            
            // if (response.code !== '0') {
            //     if (invalidPhoneMessages.includes(response.code)) {
            //         return res.status(400).json({ message: 'Số điện thoại không hợp lệ, vui lòng nhập lại.' });
            //     } else {
            //         return res.status(400).json({ message: 'Đã có lỗi xảy ra, vui lòng thử lại.' });
            //     }
                    
            // }
            console.log(phone_number, otp_code);

            return res.status(200).json({ message: 'Đã gửi mã xác thực', phone_verification_id: phone_verification_id, countdown_time: 60 });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    //hàm xác thực
    static async phoneVerification(req, res) {
        try {
            const user_id = req.user_id || null;
            const log_id = req.log_id;

            const phone_verification_id  = req.body.phone_verification_id;
            const otp_code = req.body.otp_code;

            const phone_verification = await VerificationModel.getPhoneVerificationById(phone_verification_id);

            const currentTime = new Date();

            if (!phone_verification || new Date(phone_verification.expires_at) < currentTime) {
                return res.status(400).json({ message: 'Mã xác thực đã hết hạn, vui lòng tạo mã xác thực mới.' });
            }

            if (phone_verification.otp_code != otp_code) {
                return res.status(400).json({ message: 'Mã xác thực không chính xác, vui lòng kiểm tra lại.' });
            }

            // Cập nhật is_verified thành true
            const isVerified = await VerificationModel.verifyPhoneNumber(phone_verification_id);

            if (isVerified) {
                return res.status(200).json({ message: 'Xác thực số điện thoại thành công.' });
            } else {
                return res.status(500).json({ message: 'Xác thực số điện thoại thất bại.' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = VerificationController;