CREATE TABLE songs (
    song_id INT PRIMARY KEY NOT NULL, 
    title VARCHAR(100) NOT NULL,
    image_link VARCHAR(300),
    artist VARCHAR(100)
);

CREATE TABLE universities (
    university_id SERIAL PRIMARY KEY NOT NULL,
    university_name VARCHAR(200) NOT NULL
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL, 
    password CHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    university_id INT,
    CONSTRAINT fk_university_id
        FOREIGN KEY (university_id) 
            REFERENCES universities(university_id)
);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    song_id INT,
    username VARCHAR(50),
    load_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_song_id
        FOREIGN KEY (song_id) 
            REFERENCES songs(song_id),
    CONSTRAINT fk_username
        FOREIGN KEY (username) 
            REFERENCES users(username) 
);


