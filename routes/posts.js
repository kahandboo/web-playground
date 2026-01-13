const express = require('express');
const { getDB } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = getDB();
  let page = Number(req.query.page) || 1;

  const limit = 5;
  const offset = (page - 1) * limit;

  const posts = await db.all(`
    SELECT
      posts.idx,
      posts.title,
      posts.content,
      posts.userId,
      users.username
    FROM posts
    JOIN users ON posts.userId = users.id
    ORDER BY posts.idx DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  res.render('posts/list', {
    posts,
    currentPage: page
  });
});

router.get('/detail/:idx', async (req, res) => {
  const db = getDB();
  const idx = req.params.idx;

  const post = await db.get(`
    SELECT
      posts.idx,
      posts.title,
      posts.content,
      posts.userId,
      users.username
    FROM posts
    JOIN users ON posts.userId = users.id
    WHERE posts.idx = ?
  `, [idx]);

  if (!post) {
    return res.redirect('/posts');
  }

  res.render('posts/detail', { post });
});

router.get('/write', (req, res) => {
  res.render('posts/write');
});

router.post('/write', async (req, res) => {
  const db = getDB();
  const { title, content } = req.body;
  const userId = req.session.userId;

  await db.run(
    'INSERT INTO posts (title, content, userId) VALUES (?, ?, ?)',
    [title, content, userId]
  );

  res.redirect('/posts');
});

router.get('/edit/:idx', async (req, res) => {
  const db = getDB();
  const idx = req.params.idx;
  const userId = req.session.userId;

  const post = await db.get(
    'SELECT idx, title, content, userId FROM posts WHERE idx = ?',
    [idx]
  );

  if (!post || post.userId !== userId) {
    return res.redirect('/posts');
  }

  res.render('posts/edit', { post });
});

router.post('/edit/:idx', async (req, res) => {
  const db = getDB();
  const idx = req.params.idx;
  const userId = req.session.userId;
  const { title, content } = req.body;

  const post = await db.get(
    'SELECT userId FROM posts WHERE idx = ?',
    [idx]
  );

  if (!post || post.userId !== userId) {
    return res.redirect('/posts');
  }

  await db.run(
    'UPDATE posts SET title = ?, content = ? WHERE idx = ?',
    [title, content, idx]
  );

  res.redirect('/posts');
});

router.post('/delete/:idx', async (req, res) => {
  const db = getDB();
  const idx = req.params.idx;
  const userId = req.session.userId;

  const post = await db.get(
    'SELECT userId FROM posts WHERE idx = ?',
    [idx]
  );

  if (!post || post.userId !== userId) {
    return res.redirect('/posts');
  }

  await db.run('DELETE FROM posts WHERE idx = ?', [idx]);
  res.redirect('/posts');
});

module.exports = router;
