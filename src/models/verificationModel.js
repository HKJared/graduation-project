const pool = require('../configs/connectDB');

class VerificationModel {
    // hàm tạo xác thực số điện thoại
    static async createPhoneVerification(phone_number, otp_code, user_id = null) {
        const expires_at = new Date(Date.now() + 3 * 60 * 1000);

        const queryString = `
            INSERT INTO phone_verifications (phone_number, otp_code, user_id, expires_at)
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await pool.execute(queryString, [phone_number, otp_code, user_id, expires_at]);
        
        return result.insertId;
    }

    // hàm lấy thông tin xác thực số ddienj thoại theo ID
    static async getPhoneVerificationById(phone_verification_id) {
        const queryString = `
            SELECT pv.id, pv.phone_number, pv.otp_code, pv.is_verified, pv.expires_at, u.fullname
            FROM phone_verifications pv
            LEFT JOIN users u ON pv.user_id = u.id
            WHERE pv.id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [phone_verification_id]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getPhoneVerificationById() query:', error);
            throw error;
        }
    }

    static async verifyPhoneNumber(phone_verification_id) {
        const queryString = `
            UPDATE phone_verifications
            SET is_verified = 1
            WHERE id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [phone_verification_id]);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi được cập nhật
        } catch (error) {
            console.error('Error executing verifyPhoneNumber() query:', error);
            throw error;
        }
    }

    // -----------------------------------
    // Phần thêm cho xác thực email
    // -----------------------------------

    // Hàm tạo xác thực email
    static async createEmailVerification(email, token, user_id) {
        const expires_at = new Date(Date.now() + 15 * 60 * 1000); // Hết hạn sau 15 phút

        const queryString = `
            INSERT INTO email_verifications (email, token, user_id, expires_at)
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await pool.execute(queryString, [email, token, user_id, expires_at]);

        return result.insertId;
    }

    // Hàm lấy thông tin xác thực email theo ID
    static async getEmailVerificationById(email_verification_id) {
        const queryString = `
            SELECT ev.id, ev.email, ev.token, ev.expires_at, u.fullname
            FROM email_verifications ev
            LEFT JOIN users u ON ev.user_id = u.id
            WHERE ev.id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [email_verification_id]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getEmailVerificationById() query:', error);
            throw error;
        }
    }

    // Hàm xác thực email
    static async verifyEmail(email_verification_id) {
        const queryString = `
            UPDATE email_verifications
            SET is_verified = 1
            WHERE id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [email_verification_id]);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi được cập nhật
        } catch (error) {
            console.error('Error executing verifyEmail() query:', error);
            throw error;
        }
    }
}

module.exports = VerificationModel;