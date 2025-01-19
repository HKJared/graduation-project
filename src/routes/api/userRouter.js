const express = require('express');
// const VerificationController = require('../../controllers/api/verificationController');
const UserController = require('../../controllers/api/userController');
const ElementController = require('../../controllers/api/elementController');
const TopicController = require('../../controllers/api/topicController');

const authenticate = require('../../middlewares/authentication');
const authorize = require('../../middlewares/authorization');
const ExerciseController = require('../../controllers/api/exerciseController');
const RecruitmentController = require('../../controllers/api/recruitmentController');

const apiRouter = express.Router();

apiRouter.post('/login', UserController.login);
apiRouter.get('/refresh-token', authenticate, UserController.refreshToken);
apiRouter.get('/info', authenticate, UserController.getUserInfo);
apiRouter.put('/info', authenticate, UserController.updateInfo);
apiRouter.put('/change-password', authenticate, UserController.changePassword);

apiRouter.put('/instructor', authenticate, UserController.updateInstructor);
apiRouter.put('/instructor-identification', authenticate, UserController.updateIdentification);

apiRouter.get('/topics', authenticate, TopicController.getTopicsByUser);
apiRouter.get('/topic', authenticate, TopicController.getTopicByUser);

apiRouter.get('/exercise', authenticate, ExerciseController.getExerciseByUser);

apiRouter.get('/exercise-result', authenticate, ExerciseController.getExerciseResultByUser);

apiRouter.post('/submit-multiple-choice-exercise', authenticate, ExerciseController.submitMultipleChoiceExercise);
apiRouter.post('/submit-code-exercise', authenticate, ExerciseController.submitCodeExercise);

apiRouter.post('/instructor-register', authenticate, UserController.instructorRegister) // đăng ký làm người giảng dạy

apiRouter.get('/recruitments', RecruitmentController.getRecruitments);

// api lấy element ejs
apiRouter.get('/element/:partial', ElementController.getUserElement);

module.exports = apiRouter;