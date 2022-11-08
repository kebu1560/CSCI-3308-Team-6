CREATE TABLE users (username VARCHAR(50) PRIMARY KEY, password CHAR(60) NOT NULL);

CREATE TABLE songs (
    title VARCHAR(100),
    key INT,
    imageLink VARCHAR(300),
    artist VARCHAR(100)
)