const express = require('express');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { getDB } = require('../db');
const {
  isValidUsername,
  isValidId,
  isValidPassword
} = require('../utils/validators');

const router = express.Router();

router.get('/login', (req, res) => {
  const error = req.query.error;
  let message = '';

  if (error === 'auth') {
    message = '아이디 또는 비밀번호가 올바르지 않습니다.';
  }

  res.render('login', { errorMessage: message });
});

router.post('/login', async (req, res) => {
  const { id, password } = req.body;
  const db = getDB();

  const user = await db.get(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );

  if (!user) {
    return res.redirect('/login?error=auth');
  }

  const match = await comparePassword(password, user.passwordHash);
  if (!match) {
    return res.redirect('/login?error=auth');
  }

  req.session.regenerate(err => {
    if (err) {
      return res.status(500).send('세션 재생성 실패');
    }

    req.session.userId = id;
    req.session.isLoggedIn = true;
    res.redirect('/posts');
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('로그아웃 중 오류 발생');
    }
    res.clearCookie('session-cookie');
    res.redirect('/posts');
  });
});

router.get('/signup', (req, res) => {
  const error = req.query.error;
  let message = '';

  if (error === 'name') {message = '닉네임 형식이 올바르지 않습니다.';}
  if (error === 'id') {message = '아이디 형식이 올바르지 않습니다.';}
  if (error === 'pw') {message = '비밀번호 형식이 올바르지 않습니다.';}

  res.render('signup', { errorMessage: message });
});

router.post('/signup', async (req, res) => {
  const { username, id, password } = req.body;
  const db = getDB();

  if (!isValidUsername(username)) {
    return res.redirect('/signup?error=name');
  }

  if (!isValidId(id)) {
    return res.redirect('/signup?error=id');
  }

  if (!isValidPassword(password)) {
    return res.redirect('/signup?error=pw');
  }

  const exist = await db.get(
    'SELECT id FROM users WHERE id = ? OR username = ?',
    [id, username]
  );

  if (exist) {
    return res.redirect('/signup?error=id');
  }

  const passwordHash = await hashPassword(req.body.password);

  await db.run(
    'INSERT INTO users (id, username, passwordHash) VALUES (?, ?, ?)',
    [id, username, passwordHash]
  );

  res.redirect('/login');
});

module.exports = router;
