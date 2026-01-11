const { render } = require('ejs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const app = express();

const ID_REGEX = /^[a-z0-9]{4,10}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9가-힣]{2,10}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-]).{8,32}$/;

let db;

(async () => {
    db = await open({
        filename: './db/database.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            passwordHash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS posts (
            idx INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            userId TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("SQLite DB 연결 완료");
})();

const myLogger = (req, res, next) => {
    const openPaths = ['/login', '/signup','/posts', '/'];

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

async function validateUsername(username) {
    if (!USERNAME_REGEX.test(username)) {
        return false;
    }    

    const user = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    return !user;
}

async function validateId(id) {
    if (!ID_REGEX.test(id)) {
        return false;
    }

    const user = await db.get('SELECT id FROM users WHERE id = ?', [id]);
    return !user;
}

function validatePassword(password) {
    if (!PASSWORD_REGEX.test(password)) {
        return false;
    }

    return true;
}

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

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn;
    res.locals.userId = req.session.userId;
    next();
});

app.use(myLogger);

app.get('/', (req, res) => {
    res.redirect('/posts');
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
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);

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
    if (!(await validateUsername(username))) {
        return res.redirect('/signup?error=name');
    }

    if (!(await validateId(id))) {
        return res.redirect('/signup?error=id');
    }

    if (!validatePassword(password)) {
        return res.redirect('/signup?error=pw');
    }

    const hashedPassword = await hashPassword(password);
    try {
        await db.run(
            'INSERT INTO users (id, username, passwordHash) VALUES (?, ?, ?)',
            [id, username, hashedPassword]
        );
        res.redirect('/login');
    } catch (err) {
        res.status(500).send("이미 존재하는 아이디거나 오류가 발생했습니다.");
    }
});

app.get('/posts/write', (req, res) => {
    res.render('posts/write');
})

app.post('/posts/write', async (req, res) => {
    const { title, content } = req.body;
    const userId = req.session.userId;

    await db.run(
        'INSERT INTO posts (title, content, userId) VALUES (?, ?, ?)',
        [title, content, userId]
    );
    res.redirect('/posts');
});

app.get('/profile', async (req, res) => {
    const userId = req.session.userId;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    
    res.render('profile', { profile: user });
});

app.post('/profile/username', async (req, res) => {
    const userId = req.session.userId;
    const { username } = req.body;
    if (!(await validateUsername(username))) {
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
        res.status(500).send("닉네임 변경 중 오류가 발생했습니다.");
    }
});

app.get('/posts', async (req, res) => {
    const query = `
        SELECT 
            posts.idx, 
            posts.title, 
            posts.content, 
            posts.userId, 
            users.username 
        FROM posts 
        JOIN users ON posts.userId = users.id 
        ORDER BY posts.idx DESC
    `;
    const posts = await db.all(query);
    res.render('posts/list', { posts: posts });
});

app.post('/posts/delete/:idx', async (req, res) => {
    const idx = req.params.idx;
    const userId = req.session.userId;

    const post = await db.get('SELECT userId FROM posts WHERE idx = ?', [idx]);

    if (!post || post.userId !== userId) {
        return res.redirect('/posts');
    }

    await db.run('DELETE FROM posts WHERE idx = ?', [idx]);
    res.redirect('/posts');
});

app.get('/posts/edit/:idx', async (req, res) => {
    const idx = req.params.idx;
    const userId = req.session.userId;

    const post = await db.get(
        'SELECT idx, title, content, userId FROM posts WHERE idx = ?',
        [idx]
    );

    if (!post) {
        return res.redirect('/posts');
    }

    if (post.userId !== userId) {
        return res.redirect('/posts');
    }

    res.render('posts/edit', { post });
});

app.post('/posts/edit/:idx', async (req, res) => {
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