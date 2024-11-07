const express = require('express');
const adminRouter = express.Router();
const AdminController = require('../../controllers/web/adminController');

adminRouter.get('/login', AdminController.getLoginPage);

adminRouter.get('/', AdminController.getHomePage);
adminRouter.get('/:href', AdminController.getHomePage);

module.exports = adminRouter;