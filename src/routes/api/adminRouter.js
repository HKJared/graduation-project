const express = require('express');

const authorize = require('../../middlewares/authorization');
const authenticate = require('../../middlewares/authentication');

const ElementController = require('../../controllers/api/elementController');
const RoleController = require('../../controllers/api/roleController');
const LogController = require('../../controllers/api/logController');
const UserController = require('../../controllers/api/userController');
const TopicController = require('../../controllers/api/topicController');

const   apiRouter = express.Router();

// api lấy element ejs
apiRouter.get('/element/:partial', ElementController.getAdminElement);

apiRouter.post('/login', UserController.adminLogin);
apiRouter.get('/refresh-token', authenticate, UserController.refreshToken);
apiRouter.get('/info', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, UserController.getAdminInfo);

apiRouter.get('/role-permissions', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, RoleController.getRolePermissions);

apiRouter.post('/topic', (req, res, next) => {
    authorize(req, res, 'topic-creation', next);
}, TopicController.createTopic);
apiRouter.get('/topics', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, TopicController.getTopicsByAdmin);
apiRouter.get('/topic', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, TopicController.getTopicByAdmin);
apiRouter.get('/topic-statistics', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, TopicController.getTopicStatisticsByAdmin);
apiRouter.put('/lock-topic', (req, res, next) => {
    authorize(req, res, 'topic-lock', next);
}, TopicController.lockTopic);
apiRouter.put('/unlock-topic', (req, res, next) => {
    authorize(req, res, 'topic-lock', next);
}, TopicController.unlockTopic);
apiRouter.put('/topic', (req, res, next) => {
    authorize(req, res, 'topic-edit', next);
}, TopicController.updateTopic);
apiRouter.delete('/topic', (req, res, next) => {
    authorize(req, res, 'topic-delete', next);
}, TopicController.deleteTopic);

module.exports = apiRouter;