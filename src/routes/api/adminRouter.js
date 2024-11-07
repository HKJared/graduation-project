const express = require('express');

const authorize = require('../../middlewares/authorization');
const authenticate = require('../../middlewares/authentication');

const ElementController = require('../../controllers/api/elementController');
const RoleController = require('../../controllers/api/roleController');
const LogController = require('../../controllers/api/logController');
const UserController = require('../../controllers/api/userController');
const TopicController = require('../../controllers/api/topicController');

const apiRouter = express.Router();

// api lấy element ejs
apiRouter.get('/element/:partial', ElementController.getAdminElement);

apiRouter.post('/login', UserController.adminLogin);
apiRouter.get('/refresh-token', authenticate, UserController.refreshToken);
apiRouter.get('/info', (req, res, next) => {
    authorize(req, res, 'Quản trị viên', next);
}, UserController.getAdminInfo);

apiRouter.get('/role-permissions', (req, res, next) => {
    authorize(req, res, 'Quản trị viên', next);
}, RoleController.getRolePermissions);

apiRouter.post('/topic', (req, res, next) => {
    authorize(req, res, 'Tạo chủ đề bài tập hệ thống', next);
}, TopicController.createTopic);
apiRouter.get('/topics', (req, res, next) => {
    authorize(req, res, 'Quản trị viên', next);
}, TopicController.getTopicsByAdmin);
apiRouter.get('/topic')

module.exports = apiRouter;