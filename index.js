const { render } = require('ejs');
const express = require('express');
const session = require('express-session');
const app = express();

const myLogger = (req, res, next) => {
    if (req.path === '/login') {
        return next();
    }

    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => {
    console.log('서버시작');
});

app.use(session({
    secret: 'mySecretKey', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true,
        secure: false
    },
    name: 'session-cookie'
}));

app.use(myLogger);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

const posts = [];

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', (req, res) => {
    const { username } = req.body;
    req.session.regenerate(err => {
        if (err) {
            return res.status(500).send("세션 재생성 실패");
        }
        
        req.session.userId = username;
        req.session.isLoggedIn = true;
    
        res.redirect('/');
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
            res.status(500).send("로그아웃 중 오류 발생");
        } else {
            res.redirect('/');
        }
    });
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

