class AdminController {
    static async getLoginPage(req, res) {
        try {
            return res.status(200).render('admin/login');
        } catch (error) {
            console.error(error);
            return res.status(404).render('server-error');
        }
    }

    static async getHomePage(req, res) {
        try {
            return res.status(200).render('admin/index');
        } catch (error) {
            console.error(error);
            return res.status(404).render('server-error');
        }
    }
}

module.exports = AdminController;