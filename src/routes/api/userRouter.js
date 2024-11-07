const express = require('express');
// const VerificationController = require('../../controllers/api/verificationController');
const UserController = require('../../controllers/api/userController');
const ElementController = require('../../controllers/api/elementController');

const authenticate = require('../../middlewares/authentication');
const authorize = require('../../middlewares/authorization');

const apiRouter = express.Router();

apiRouter.post('/login', UserController.login);
apiRouter.get('/refresh-token', authenticate, UserController.refreshToken);
apiRouter.get('/info', authenticate, UserController.getUserInfo);

// api lấy element ejs
apiRouter.get('/element/:partial', ElementController.getUserElement);

module.exports = apiRouter;