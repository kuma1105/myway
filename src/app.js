const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
require('dotenv').config();
// const { connectToDatabase } = require('./models/index');
const app = express();
const PORT = process.env.PORT;

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// 데이터베이스 연결
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 세션 설정
app.use(session({
    secret: 'your_secret_key', // 비밀 키를 설정하세요
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS를 사용하는 경우 true로 설정하세요
}));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            res.status(500).send('Internal server error');
            return;
        }

        if (results.length > 0) {
            // 로그인 성공
            console.log('User logged in:', results);
            console.log('User logged in:', results[0]);
            req.session.user = results[0]; // 세션에 사용자 정보 저장
            res.redirect('/mypage'); // 성공 시 이동할 페이지
        } else {
            // 로그인 실패
            res.render('index', { error: 'Invalid username or password' });
        }
    });
});

app.get('/mypage', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const userId = req.session.user.id;
    const ordersQuery = 'SELECT * FROM sandwich_orders WHERE user_id = ?';
    const friendsQuery = `
        SELECT u.id, u.username 
        FROM friends f 
        JOIN users u ON f.friend_id = u.id 
        WHERE f.user_id = ?`;

    db.query(ordersQuery, [userId], (err, orders) => {
        if (err) {
            console.error('Error querying the database:', err);
            res.status(500).send('Internal server error');
            return;
        }

        db.query(friendsQuery, [userId], (err, friends) => {
            if (err) {
                console.error('Error querying the database:', err);
                res.status(500).send('Internal server error');
                return;
            }

            res.render('mypage', { title: '마이페이지', user: req.session.user, orders, friends });
        });
    });
});

app.get('/menu', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.render('menu', { title: '메뉴' });
});

app.post('/menu', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    console.log('req.body:', req.body);
    const { sandwich_menu, bread_type, excludedVegetables = [], extra_toppings = [], sauces = [] } = req.body;

    const userId = req.session.user.id; // 세션에서 사용자 ID 가져오기
    const allVegetables = ['양상추', '토마토', '오이', '피망(파프리카)', '양파', '피클', '올리브', '할라피뇨', '아보카도'];
    const includedVegetables = allVegetables.filter(veg => !excludedVegetables.includes(veg));
    const query = 'INSERT INTO sandwich_orders (user_id, sandwich_menu, bread_type, included_vegetables, extra_toppings, sauces) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [
        userId, sandwich_menu, bread_type,
        includedVegetables.join(','),
        Array.isArray(extra_toppings) ? extra_toppings.join(',') : extra_toppings,
        Array.isArray(sauces) ? sauces.join(',') : sauces
    ], (err) => {
        if (err) {
            console.error('Error inserting into the database:', err);
            res.status(500).send('Internal server error');
            return;
        }
        res.redirect('/mypage');
    });
});

app.post('/add-friend', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    console.log('req.body:', req.body);
    const { friendUsername } = req.body;
    const userName = req.session.user.username; // 세션에서 사용자 ID 가져오기

    if (userName === friendUsername) {
        return res.send({ success: false, message: 'You cannot add yourself as a friend' });
    }

    // Check if the friend exists
    const checkFriendQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkFriendQuery, [friendUsername], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            res.status(500).send('Internal server error');
            return;
        }

        if (results.length > 0) {
            console.log('results:', results);

            const userId = req.session.user.id;
            const friendId = results[0].id;

            // 친구 ID가 존재하면 friends 테이블에 추가
            const addFriendQuery = 'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)';
            db.query(addFriendQuery, [userId, friendId], (err, results) => {
                if (err) {
                    console.error('Error inserting into the database:', err);
                    res.status(500).send('Internal server error');
                    return;
                }
                res.send({ success: true, message: '친구가 추가되었습니다.' });
            });
        } else {
            // 친구 ID가 존재하지 않음
            res.send({ success: false, message: '친구 ID가 존재하지 않습니다.' });
        }
    });
});

// 친구의 마이웨이 목록 가져오기
app.get('/friend-orders/:friendUsername', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const friendUsername = req.params.friendUsername;
    const friendUserIdQuery = 'SELECT * FROM users WHERE username = ?';
    console.log("friendUsername ", friendUsername);

    db.query(friendUserIdQuery, [friendUsername], (err, friendId) => {
        if (err) {
            console.error('Error querying the database:', err);
            res.status(500).send('Internal server error');
            return;
        }
        friendId = friendId[0].id;
        console.log("friendId ", friendId);
        const friendOrdersQuery = 'SELECT * FROM sandwich_orders WHERE user_id = ?';

        db.query(friendOrdersQuery, [friendId], (err, friendOrders) => {
            if (err) {
                console.error('Error querying the database:', err);
                res.status(500).send('Internal server error');
                return;
            }
            console.log("frinedOrders", friendOrders);
            res.send({ title: '마이페이지', user: req.session.user, friendOrders });
        });
    });
});

app.get('/api/example', (req, res) => {
    res.json({ message: 'This is an example API route' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});