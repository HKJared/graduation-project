class UserController {
    static async getAuthLoginPage(req, res) {
        try {
            return res.status(200).render('user/auth-login');
        } catch (error) {
            console.error(error);
            return res.status(404).render('server-error');
        }
    }

    static async getLoginRegisterPage(req, res) {
        try {
            const is_login = req.path.includes('/login');

            return res.status(200).render('user/login-register', { is_login: is_login });
        } catch (error) {
            console.error(error);
            return res.status(404).render('server-error');
        }
    }

    static async getHomePage(req, res) {
        try {
            return res.status(200).render('user/index');
        } catch (error) {
            console.error(error);
            return res.status(404). render('server-error');
        }
    }
}

module.exports = UserController;