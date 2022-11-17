-- Songs dummy data
INSERT INTO songs (song_id, title, artist, image_link) VALUES (157666213, 'Wildest Dreams', 'Taylor Swift', 'https://is2-ssl.mzstatic.com/image/thumb/Music124/v4/b2/38/d3/b238d354-1aec-f71b-8706-26fcb1738b6d/00843930039562.rgb.jpg/400x400cc.jpg');
INSERT INTO songs (song_id, title, artist, image_link) VALUES (44827968, 'Our Song', 'Taylor Swift', 'https://is4-ssl.mzstatic.com/image/thumb/Music128/v4/fb/03/7c/fb037c3d-1205-fb5b-19e2-3c28ce2d0d14/00843930039524.rgb.jpg/400x400cc.jpg');
INSERT INTO songs (song_id, title, artist, image_link) VALUES (404666905, 'Top Off', 'Gunna', 'https://is3-ssl.mzstatic.com/image/thumb/Music124/v4/7e/95/25/7e952523-510a-8c5a-7f74-9c1afc527194/814908027713.jpg/400x400cc.jpg');


-- Universities
INSERT INTO universities (university_name) VALUES ('University of Colorado Boulder');
INSERT INTO universities (university_name) VALUES ('Colorado State University');
INSERT INTO universities (university_name) VALUES ('University of Utah');
INSERT INTO universities (university_name) VALUES ('University of Wyoming');
INSERT INTO universities (university_name) VALUES ('Air Force Academy');
INSERT INTO universities (university_name) VALUES ('Colorado School of Mines');


-- users
INSERT INTO users (username, password, university_id) VALUES ('Blake', 'pw', 1);
INSERT INTO users (username, password, university_id) VALUES ('User1', 'pw', 1);
INSERT INTO users (username, password, university_id) VALUES ('User2', 'pw', 1);
INSERT INTO users (username, password, university_id) VALUES ('User3', 'pw', 1);
INSERT INTO users (username, password, university_id) VALUES ('User4', 'pw', 1);
INSERT INTO users (username, password, university_id) VALUES ('User5', 'pw', 1);
INSERT INTO users (username, password, university_id) VALUES ('User6', 'pw', 1);


-- transactions
INSERT INTO transactions (song_id, username, load_timestamp) VALUES (44827968, 'Blake', '2022-11-05T01:03:26.326Z');
INSERT INTO transactions (song_id, username) VALUES (404666905, 'Blake');
INSERT INTO transactions (song_id, username) VALUES (404666905, 'User1');