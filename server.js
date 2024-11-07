const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const passport = require('./src/utils/auth');
const compilex = require("compilex");

const configViewEngine = require('./src/configs/viewEngine');

// auth router
const authRouter = require('./src/routes/auth/authRouter');

//api router
const adminApiRouter = require('./src/routes/api/adminRouter');
const instructorApiRouter = require('./src/routes/api/instructorRouter');
const userApiRouter = require('./src/routes/api/userRouter');
const apiRouter = require('./src/routes/api/apiRouter');

//web router
const adminWebRouter = require('./src/routes/web/adminRouter');
const instructorWebRouter = require('./src/routes/web/instructorRouter');
const userWebRouter = require('./src/routes/web/userRouter');

const app = express();

const port = process.env.PORT || 8080;

const options = { stats: true };
compilex.init(options);

// Middleware Passport
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use('/auth/', authRouter)

app.use('/api/admin/', adminApiRouter);
app.use('/api/instructor/', instructorApiRouter);
app.use('/api/user/', userApiRouter);
app.use('/api/', apiRouter);

app.use('/admin/', adminWebRouter);
app.use('/instructor/', instructorWebRouter);
app.use('/', userWebRouter);

configViewEngine(app);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});