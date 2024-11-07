const express = require('express');

const passport = require('../../utils/auth');
const JWTService = require('../../utils/jwtService');
const UserController = require('../../controllers/api/userController')

const authRouter = express.Router();

// Login
authRouter.get('/login', async (req, res) => {
    try {
        return res.status(200).render('auth-login');
    } catch (error) {
        console.error(error);
        return res.status(404).render('server-error');
    }
});

// Routes
authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
authRouter.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
authRouter.get('/github', passport.authenticate('github'));

// Callback routes
authRouter.get('/callback/google',
    passport.authenticate('google', { failureRedirect: '/' }),
    async (req, res) => {
        try {
            // Gọi hàm findOrCreateUser để lấy userId
            const userId = await UserController.findOrCreateUser(req, res);

            // Mã hóa userId
            const accessToken = await JWTService.generateToken(userId);
            const refreshToken = await JWTService.generateRefreshToken(userId);

            // Chuyển hướng người dùng đến trang login với access_token và refresh_token
            return res.redirect(`/auth/login?access_token=${accessToken}&refresh_token=${refreshToken}`);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
);

authRouter.get('/callback/facebook',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    (req, res) => res.redirect('/profile')
);

authRouter.get('/callback/github',
    passport.authenticate('github', { failureRedirect: '/' }),
    async (req, res) => {
        try {
            // Gọi hàm findOrCreateUser để lấy userId
            const userId = await UserController.findOrCreateUser(req, res);

            // Mã hóa userId
            const accessToken = await JWTService.generateToken(userId);
            const refreshToken = await JWTService.generateRefreshToken(userId);

            // Chuyển hướng người dùng đến trang login với access_token và refresh_token
            return res.redirect(`/auth/login?access_token=${accessToken}&refresh_token=${refreshToken}`);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
);

module.exports = authRouter;