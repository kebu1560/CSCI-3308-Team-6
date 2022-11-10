CREATE TABLE songs (
    song_id INT PRIMARY KEY NOT NULL, 
    title VARCHAR(100) NOT NULL,
    image_link VARCHAR(300),
    artist VARCHAR(100)
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY NOT NULL, 
    username VARCHAR(50) NOT NULL, 
    password CHAR(50) NOT NULL
);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    song_id INT,
    user_id,
    load_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT fk_song_id
        FOREIGN KEY (song_id) 
            REFERENCES songs(song_id),
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id) 
            REFERENCES users(user_id) 
);

CREATE TABLE univerisities (
    university_id SERIAL PRIMARY KEY NOT NULL,
    university_name VARCHAR(200) NOT NULL
);

-- CREATE TABLE songs_to_users (
--     song_id INT,
--     user_id INT,
--     CONSTRAINT fk_song_id
--         FOREIGN KEY (song_id) 
--             REFERENCES songs(song_id),
--     CONSTRAINT fk_user_id
--         FOREIGN KEY (user_id) 
--             REFERENCES users(user_id)    
-- );

-- CREATE TABLE universities_to_users (
--     FOREIGN KEY (university_id) REFERENCES universities(university_id),
--     FOREIGN KEY (user_id) REFERENCES users(user_id)
-- );