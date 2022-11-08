CREATE TABLE music (
    song_id SERIAL PRIMARY KEY NOT NULL, 
    song_name VARCHAR(100) NOT NULL 
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY NOT NULL, 
    username VARCHAR(50) NOT NULL, 
    password CHAR(50) NOT NULL
);

CREATE TABLE univerisities (
    university_id SERIAL PRIMARY KEY NOT NULL,
    university_name VARCHAR(200) NOT NULL
);

CREATE TABLE music_to_users (
    FOREIGN KEY (song_id) REFERENCES music(song_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)    
);

CREATE TABLE universities_to_users (
    FOREIGN KEY (university_id) REFERENCES universities(university_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);