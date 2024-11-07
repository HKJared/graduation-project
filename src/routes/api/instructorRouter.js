const express = require('express');
// const VerificationController = require('../../controllers/api/verificationController');
const UserController = require('../../controllers/api/userController');
const ElementController = require('../../controllers/api/elementController');
const RoleController = require('../../controllers/api/roleController');
const LogController = require('../../controllers/api/logController');

const authenticate = require('../../middlewares/authentication');
const authorize = require('../../middlewares/authorization');


const apiRouter = express.Router();

// api lấy element ejs
apiRouter.get('/element/instructor/:partial', ElementController.getInstructorElement);

// apiRouter.post('/login', UserController.login);

module.exports = apiRouter;