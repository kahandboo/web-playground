const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.listen(3000, () => {
    console.log('서버시작');
});

const posts = [];

app.post('/post', (req, res) => {
    const { title, content } = req.body;
    posts.push({ title, content });
    res.redirect('/posts');
});

app.get('/posts', (req, res) => {
    let html = '<h1>게시글 목록</h1>';
    posts.forEach(post => {
        html += `<h2>${post.title}</h2><p>${post.content}</p>`;
    });
    res.send(html);
});