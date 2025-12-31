const { render } = require('ejs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

const ID_REGEX = /^[a-z0-9]{4,10}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9가-힣]{2,10}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-]).{8,32}$/;


const myLogger = (req, res, next) => {
    const openPaths = ['/login', '/signup'];

    if (openPaths.includes(req.path)) {
        return next();
    }

    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

async function hashPassword(password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
}

function validateUsername(username) {
    if (Object.values(users).some(user => user.username === username)) {
        return false;
    }

    if (!USERNAME_REGEX.test(username)) {
        return false;
    }

    return true;
}

function validateId(id) {
    if (users[id]) {
        return false;
    }

    if (!ID_REGEX.test(id)) {
        return false;
    }

    return true;
}

function validatePassword(password) {
    if (!PASSWORD_REGEX.test(password)) {
        return false;
    }

    return true;
}

const posts = [];
const users = {};

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
        sameSite: 'lax',
        secure: false
    },
    name: 'session-cookie'
}));

app.use(myLogger);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/login', (req, res) => {
    const error = req.query.error;
    let message = "";
    if (error === 'auth') {
        message = "아이디 또는 비밀번호가 올바르지 않습니다.";
    }

    res.render('login', { errorMessage: message });
});

app.post('/login', async (req, res) => {
    const { id, password } = req.body;
    const user = users[id];

    if (!user) {
        return res.redirect('/login?error=auth');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
        return res.redirect('/login?error=auth');
    }

    req.session.regenerate(err => {
        if (err) {
            return res.status(500).send("세션 재생성 실패");
        }
        
        req.session.userId = id;
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
            res.clearCookie('session-cookie')
            res.redirect('/');
        }
    });
});

app.get('/signup', (req, res) => {
    const error = req.query.error;
    let message = "";

    if (error === 'name') message = "닉네임은 2-10자의 한글, 영문, 숫자만 가능합니다.";
    if (error === 'id') message = "아이디는 4-10자의 영문 소문자와 숫자만 가능합니다.";
    if (error === 'pw') message = "비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.";

    res.render('signup', { errorMessage: message });
});

app.post('/signup', async (req, res) => {
    const { username, id, password } = req.body;
    if (!validateUsername(username)) {
        return res.redirect('/signup?error=name');
    }

    if (!validateId(id)) {
        return res.redirect('/signup?error=id');
    }

    if (!validatePassword(password)) {
        return res.redirect('/signup?error=pw');
    }

    const hashedPassword = await hashPassword(password);
    users[id] = { 
        username: username,
        passwordHash: hashedPassword
    };
    console.log(users);

    return res.redirect('/login')
});

app.post('/post', (req, res) => {
    const { title, content } = req.body;
    const id = req.session.userId;
    const user = users[id];
    const username = user.username;
    posts.push({ title, content, username });
    res.redirect('/posts');
});

app.get('/posts', (req, res) => {
    res.render('posts', { posts: posts });
});

