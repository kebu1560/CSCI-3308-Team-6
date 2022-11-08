CREATE TABLE users (username VARCHAR(50) PRIMARY KEY, password CHAR(60) NOT NULL);

CREATE TABLE songs (
    title VARCHAR(100),
    song_id INT PRIMARY KEY,
    image_linkink VARCHAR(300),
    artist VARCHAR(100)
);

CREATE TABLE userData (
    transaction_id SERIAL PRIMARY KEY,
    load_date DATE NOT NULL DEFAULT CURRENT_DATE
);