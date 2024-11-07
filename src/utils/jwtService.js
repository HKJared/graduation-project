const jwt = require('jsonwebtoken');
require('dotenv').config();

const access_secret = process.env.JWT_ACCESS_SECRET;
const refresh_secret = process.env.JWT_REFRESH_SECRET;

class JWTService {
    static async generateToken(user_id) {
        return jwt.sign({ user_id: user_id }, access_secret, { expiresIn: '15m' });
    };

    static async generateRefreshToken(user_id) {
        return jwt.sign({ user_id: user_id }, refresh_secret, { expiresIn: '2w' });
    };

    static async decodeToken(token) {
        try {
            const decoded = jwt.verify(token, access_secret);
            return decoded;
        } catch (error) {
            console.error('Failed to decode token: ', error);
        }
    };
    
    static async decodeRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, refresh_secret);
            return decoded;
        } catch (error) {
            console.error('Failed to decode refresh token: ', error);
        }
    };
}

module.exports = JWTService;