class InstructorController {
    static async getLoginPage(req, res) {
        try {
            return res.status(200).render('instructor/login');
        } catch (error) {
            console.error(error);
            return res.status(404).render('server-error');
        }
    }

    static async getRegisterPage(req, res) {
        try {
            return res.status(200).render('instructor/register');
        } catch (error) {
            console.error(error);
            return res.status(404).render('server-error');
        }
    }

    static async getHomePage(req, res) {
        try {
            const partial = 'home'
            return res.status(200).render('instructor/index', { partial: partial });
        } catch (error) {
            console.error(error);
            return res.status(404).render('server-error');
        }
    }
}

module.exports = InstructorController;