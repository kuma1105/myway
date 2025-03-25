-- SELECT Host,User,plugin FROM mysql.user;
-- ALTER USER 'manager'@'%' IDENTIFIED WITH mysql_native_password BY '1105';


CREATE DATABASE myway_database;
USE myway_database;

-- users 테이블
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

SELECT * FROM users;
DROP TABLE users;
ALTER TABLE users CHANGE username user_id VARCHAR(255) NOT NULL;
INSERT INTO users (username, password) VALUES ('user1', 'password1');
INSERT INTO users (username, password) VALUES ('user2', 'password2');
INSERT INTO users (username, password) VALUES ('user3', 'password3');

-- sandwich_orders 테이블
CREATE TABLE sandwich_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sandwich_menu VARCHAR(255) NOT NULL,
    bread_type VARCHAR(255) NOT NULL,
    included_vegetables VARCHAR(255),
    extra_toppings VARCHAR(255),
    sauces VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

SELECT * FROM sandwich_orders;
DROP TABLE sandwich_orders;
TRUNCATE TABLE sandwich_orders; -- 자동 증가 값도 초기화합니다.

-- friends 테이블
CREATE TABLE friends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

SELECT * FROM friends;
DROP TABLE friends;
SELECT u.id, u.username 
        FROM friends f 
        JOIN users u ON f.friend_id = u.id 
        WHERE f.user_id = 1;



