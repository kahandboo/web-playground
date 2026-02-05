const express = require('express');
const { getDB } = require('../db');
const { isValidUsername } = require('../utils/validators');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = getDB();
  const userId = req.session.userId;
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    
  res.render('profile', { profile: user });
});

router.post('/username', async (req, res) => {
  const db = getDB();
  const userId = req.session.userId;
  const { username } = req.body;

  if (!isValidUsername(username)) {
    return res.redirect('/profile?error=name');
  }

  const exist = await db.get(
    'SELECT id FROM users WHERE username = ?',
    [username]
  );

  if (exist) {
    return res.redirect('/profile?error=name');
  }

  try {
    await db.run(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, userId]
    );

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('닉네임 변경 중 오류가 발생했습니다.');
  }
});

module.exports = router;