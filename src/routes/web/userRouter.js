const express = require('express');
const userRouter = express.Router();

const UserController = require('../../controllers/web/userController');

userRouter.get('/', UserController.getHomePage);
userRouter.get('/login', UserController.getLoginRegisterPage);
userRouter.get('/register', UserController.getLoginRegisterPage);
userRouter.get('/:partial', UserController.getHomePage);

module.exports = userRouter;