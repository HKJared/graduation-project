const express = require('express');

const authorize = require('../../middlewares/authorization');
const authenticate = require('../../middlewares/authentication');

const ElementController = require('../../controllers/api/elementController');
const RoleController = require('../../controllers/api/roleController');
const LogController = require('../../controllers/api/logController');
const UserController = require('../../controllers/api/userController');
const TopicController = require('../../controllers/api/topicController');
const ExerciseController = require('../../controllers/api/exerciseController');
const RequestController = require('../../controllers/api/requestController');
const RecruitmentController = require('../../controllers/api/recruitmentController');

const   apiRouter = express.Router();

// api lấy element ejs
apiRouter.get('/element/:partial', ElementController.getAdminElement);

apiRouter.post('/login', UserController.adminLogin);
apiRouter.get('/refresh-token', authenticate, UserController.refreshToken);
apiRouter.get('/info', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, UserController.getAdminInfo);

apiRouter.get('/admins', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, UserController.getAdmins);
apiRouter.get('/admin', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, UserController.getAdminById);
apiRouter.post('/admin', (req, res, next) => {
    authorize(req, res, 'admin-creation', next);
}, UserController.createUser);
apiRouter.put('/admin', (req, res, next) => {
    authorize(req, res, 'admin-authorization', next);
}, UserController.updateAdmin);
apiRouter.delete('/admin', (req, res, next) => {
    authorize(req, res, 'admin-authorization', next);
}, UserController.deleteAdmin);

//  TODO: Role
apiRouter.post('/role', (req, res, next) => {
    authorize(req, res, 'admin-authorization', next);
}, RoleController.createRole);
apiRouter.get('/roles', (req, res, next) => {
    authorize(req, res, 'admin-authorization', next);
}, RoleController.getRoles);
apiRouter.put('/role', (req, res, next) => {
    authorize(req, res, 'admin-authorization', next);
}, RoleController.updateRole);
apiRouter.delete('/role', (req, res, next) => {
    authorize(req, res, 'admin-authorization', next);
}, RoleController.deleteRole);

apiRouter.get('/role-permissions', authenticate, RoleController.getRolePermissions);
apiRouter.put('/role-permissions', (req, res, next) => {
    authorize(req, res, 'admin-authorization', next);
}, RoleController.updateRolePermissions);


// TODO:Topics
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


apiRouter.post('/exercise', (req, res, next) => {
    authorize(req, res, 'exercise-creation', next);
}, ExerciseController.createExercise);
apiRouter.put('/exercise', (req, res, next) => {
    authorize(req, res, 'exercise-edit', next);
}, ExerciseController.updateExercise);
apiRouter.delete('/exercise', (req, res, next) => {
    authorize(req, res, 'exercise-delete', next);
}, ExerciseController.deleteExercise);
apiRouter.get('/topic-exercises', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, ExerciseController.getTopicExercisesByAdmin);
apiRouter.get('/exercise', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, ExerciseController.getExercise);


apiRouter.put('/mutiple-choice-exercise', (req, res, next) => {
    authorize(req, res, 'exercise-edit', next);
}, ExerciseController.createOrUpdateMultipleChoiceExercise);

apiRouter.put('/code-exercise', (req, res, next) => {
    authorize(req, res, 'exercise-edit', next);
}, ExerciseController.updateCodeExercise);


apiRouter.get('/requests', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, RequestController.getRequests);
apiRouter.put('/request', (req, res, next) => {
    authorize(req, res, 'request-edit', next);
}, RequestController.updateRequest);


apiRouter.get('/recruitments', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, RecruitmentController.getRecruitments);
apiRouter.get('/recruitment', (req, res, next) => {
    authorize(req, res, 'admin', next);
}, RecruitmentController.getRecruitment);
apiRouter.post('/recruitment', (req, res, next) => {
    authorize(req, res, 'recruitment-creation', next);
}, RecruitmentController.createRecruitment);
apiRouter.put('/recruitment', (req, res, next) => {
    authorize(req, res, 'recruitment-edit', next);
}, RecruitmentController.updateRecruitment);
apiRouter.delete('/recruitment', (req, res, next) => {
    authorize(req, res, 'recruitment-delete', next);
}, RecruitmentController.deleteRecruitment);

module.exports = apiRouter;