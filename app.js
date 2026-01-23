const express = require('express');
const session = require('express-session');

const authMiddleware = require('./middlewares/auth');
const localsMiddleware = require('./middlewares/locals');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
require('dotenv').config();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  },
  name: 'session-cookie'
}));

app.use(localsMiddleware);

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/index'));
app.use('/posts', require('./routes/posts'));
app.use('/profile', authMiddleware, require('./routes/profile'));

module.exports = app;