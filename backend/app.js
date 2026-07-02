const express = require('express');
const morgan = require('morgan');
const morganBody = require('morgan-body');
const path = require('path');
const rateLimit = require('express-rate-limit'); // security
const helmet = require('helmet'); // security
const sanitizeRequest = require('./utils/sanitize'); // XSS protection
const cors = require('cors');
const AppError = require(`./utils/appError`);

const globalErrorHandler = require(`./controllers/errorController`);
//TODO:Add routes

const app = express();

// Global MiddleWares

//set security http headers
app.use(helmet()); // set el http headers property

app.use(cors());

//NOTE: Toggle it on if u need
// app.options('/*', cors());

// Policy for blocking images
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

//development logging
if (process.env.NODE_ENV === 'development') {
  // app.use(morgan('dev'));
  morganBody(app, {
    logAllReqHeader: true,
  });
}

//Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests please try again later',
});

app.use('/api', limiter); // (/api)=> all routes start with /api

//Body parser, reading data from body into req.body
app.use(express.json()); //middleware for req,res json files & req.body

//Data sanitization against cross site scripting attacks (XSS)
app.use(sanitizeRequest);

app.use('/api/public', express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//TODO: ADD APIS

app.use((req, res, next) => {
  next(new AppError(`Can't find the url ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;