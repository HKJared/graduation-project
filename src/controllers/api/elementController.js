const fs = require('fs');
const path = require('path');

class ElementController {
    static async getInstructorElement(req, res) {
        try {
            const partial = req.params.partial;
            const filePath = path.join(__dirname, '../../views/instructor/partials', `${partial}.ejs`);
        
            // Kiểm tra xem file có tồn tại không
            if (fs.existsSync(filePath)) {
                return res.status(200).render(`instructor/partials/${partial}`);
            } else {
                return res.status(200).render('page-not-found');
            }
        } catch (error) {
            console.error('Error at getinstructorElement():', error);
            return res.status(500).send('Server error');
        }
    }

    static async getUserElement(req, res) {
        try {
            const partial = req.params.partial;
            const filePath = path.join(__dirname, '../../views/user/partials', `${partial}.ejs`);
        
            // Kiểm tra xem file có tồn tại không
            if (fs.existsSync(filePath)) {
                return res.status(200).render(`user/partials/${partial}`);
            } else {
                return res.status(200).render('page-not-found');
            }
        } catch (error) {
            console.error('Error at getuserElement():', error);
            return res.status(500).send('Server error');
        }
    }

    static async getuserSubElement(req, res) {
        try {
            const partial = req.params.partial;
            const sub_partial = req.params.sub_partial;
            const filePath = path.join(__dirname, `../../views/user/partials/${ partial }-partials`, `${sub_partial}.ejs`);
        
            // Kiểm tra xem file có tồn tại không
            if (fs.existsSync(filePath)) {
                return res.status(200).render(`user/partials/${ partial }-partials/${ sub_partial }`);
            } else {
                return res.status(200).render('page-not-found');
            }
        } catch (error) {
            console.error('Error at getuserElement():', error);
            return res.status(500).send('Server error');
        }
    }

    static async getAdminElement(req, res) {
        try {
            const partial = req.params.partial;
            const filePath = path.join(__dirname, '../../views/admin/partials', `${partial}.ejs`);
        
            // Kiểm tra xem file có tồn tại không
            if (fs.existsSync(filePath)) {
                return res.status(200).render(`admin/partials/${partial}`);
            } else {
                return res.status(200).render('page-not-found');
            }
        } catch (error) {
            console.error('Error at getAdminElement():', error);
            return res.status(500).send('Server error');
        }
    }
}

module.exports = ElementController;