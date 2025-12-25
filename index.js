const { render } = require('ejs');
const express = require('express');
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => {
    console.log('서버시작');
});

app.use(session({
    secret: 'mySecretKey', 
    resave: false,
    saveUninitialized: true,
    cookie: { 
        httpOnly: true,
        secure: false
    },
    name: 'session-cookie'
}));

app.get('/', (req, res) => {
    if (req.session.isLoggedIn){
        res.sendFile(__dirname + '/views/index.html');
    } else {
        res.redirect('/login');
    }
});

const posts = [];

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', (req, res) => {
    const { username } = req.body;
    req.session.userId = username;
    req.session.isLoggedIn = true;
    res.redirect('/');
});

app.post('/post', (req, res) => {
    const { title, content } = req.body;
    const username = req.session.userId;
    posts.push({ title, content, username });
    res.redirect('/posts');
});

app.get('/posts', (req, res) => {
    res.render('posts', { posts: posts });
});

