/*Example insert statements*/

/*A song insert happens in the search feature*/
INSERT INTO music
(
    song_id,
    song
) 
VALUES 
    (1, "popularSong");

/*A user insert happens at registration*/
INSERT INTO users
(
    user_id,
    username,
    password
) 
VALUES 
    (1, "name", "strongPassword");

/*A university insert happens at registration*/
INSERT INTO universities
(
    university_id,
    university_name
)
VALUES
    (1, "CU Boulder");

/*This table updated with music in search feature*/
INSERT INTO music_to_users
(
    song_id,
    user_id
)
VALUES
    (1,1);

/*This table updated in registration*/
INSERT INTO universities_to_users
(
    university_id,
    user_id
)
VALUES 
    (1,1);
