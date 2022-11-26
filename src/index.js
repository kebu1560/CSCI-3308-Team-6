const express = require("express");
const app = express();
const pgp = require("pg-promise")();
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { URLSearchParams } = require("url");

// database configuration
const dbConfig = {
  host: "db",
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then((obj) => {
    console.log("Database connection successful"); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch((error) => {
    console.log("ERROR:", error.message || error);
  });

app.set("view engine", "ejs");

app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
var access_token = "";
var refresh_token = "";

app.get("/", (req, res) => {
  // console.log("/ route");
  // res.send('home');
  res.render("pages/index"); // index is the first/welcome page for the / route
});

app.get("/home", (req, res) => {
  // get universities for dropdown list
  var query = "SELECT * FROM universities;";
  var uni_list = null;
  values = [req.body];
  db.any(query, values)
    .then(async (data) => {
      // res.render("pages/home", { data: data, users_uni: 1 });
      uni_list = data;
    })
    .catch((err) => {
      console.log(err);
      res.send("error");
    });

  // console.log("university chart route");

  // Getting data from request
  const university_id = req.query.university_id ? req.query.university_id : 1;
  const limit = req.query.limit ? req.query.limit : 10;
  const time = req.query.time ? req.query.time : "365days";

  query =
    "SELECT songs.song_id, songs.artist, songs.title, songs.image_link, COUNT (songs.title) AS popularity_score FROM transactions LEFT JOIN users ON users.username = transactions.username LEFT JOIN songs ON songs.song_id = transactions.song_id WHERE university_id = $1 AND transactions.load_timestamp BETWEEN NOW() - INTERVAL $2 AND NOW() GROUP BY(songs.title, songs.image_link, songs.song_id) ORDER BY(popularity_score) DESC LIMIT $3;";
  values = [university_id, time, limit];
  db.any(query, values)
    .then(async (data) => {
      // console.log("data::::", data);
      res.render("pages/home", {
        songs: data,
        uni_list: uni_list,
        uni_id: university_id,
        time: time,
      });
    })
    .catch((err) => {
      console.log(err);
      res.send("error");
    });
});

app.get("/login", (req, res) => {
  // console.log("/login");
  // res.send('home');
  res.render("pages/login");
});

app.post("/login", async (req, res) => {
  const query = "SELECT * FROM users WHERE username = $1;";
  console.log("attempting to login");

  const returnedUser = await db
    .oneOrNone(query, [req.body.username])
    .then(async (data) => {
      if (data) {
        const match = await bcrypt.compare(
          req.body.password.trim(),
          data.password.trim()
        );
        if (match) {
          //If password matches, take user to home page
          req.session.user = {
            api_key: process.env.API_KEY,
          };
          req.session.save();
          return res.redirect("/home");
        } else {
          //incorrect password error
          console.log("Incorrect username or password.");
          res.render("pages/login", {
            message: "Incorrect username or password",
            error: true,
          });
        }
      } else {
        //user does not exist
        console.log("User does not exist");
        res.render("pages/register", {
          message: "User does not exist, please create an account",
          error: true,
        });
      }
    })
    .catch((err) => {
      console.log("Error in logging in, ", err);
      res.render("pages/login", {
        message: "Database connection failed",
        error: true,
      });
    });
});

app.get("/register", (req, res) => {
  // console.log("/login");
  // res.send('home');
  res.render("pages/register");
});

app.post("/register", async (req, res) => {
  const username = req.body.username;
  // const password = req.body.password;
  const hash = await bcrypt.hash(req.body.password.trim(), 10);

  //need to check if user already exists?

  //Fine to register new user
  const query = `INSERT INTO users (username, password, location) VALUES ('${username}','${hash}','Boulder');`;

  db.any(query)
    .then(() => {
      res.redirect("/login");
    })
    .catch(function (err) {
      console.log("Error in logging in,", err);
      res.redirect("/register");
    });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Route to log in to SPotify
// Will likely be modified to fit into our own login endpoint
app.get("/login2", (req, res) => {
  console.log("/login route");

  // should be a random number. For our purposes, this should be fine
  var state = "superrandomnumber";
  var scope = "user-read-private user-read-email";

  params = {
    response_type: "code",
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
    state: state,
  };

  // redirecting to spotify authorize endpoint to get a verification code
  console.log(
    "https://accounts.spotify.com/authorize?" +
      new URLSearchParams(params).toString()
  );
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      new URLSearchParams(params).toString()
  );
});

// Route to search for songs
app.get("/search_song", async (req, res) => {
  const q = req.query.search_query;
  //limiting the number of results
  limit = 10;

  // console.log("@", req.query);

  const options = {
    method: "GET",
    url: "https://shazam.p.rapidapi.com/search",
    params: {
      term: q,
      locale: "en-US",
      offset: "0",
      limit: limit,
    },
    headers: {
      "X-RapidAPI-Key": "5c60a9f7e5msh6e3e990c63159adp184964jsn0ca34bbc7771",
      "X-RapidAPI-Host": "shazam.p.rapidapi.com",
    },
  };

  axios
    .request(options)
    .then(function (response) {
      // FInding number of songs and artists found
      num_songs = response.data.tracks.hits.length;
      num_artists = response.data.artists.hits.length;

      console.log("$$$", response.data);
      //Checking to make sure there are results being sent back
      if (num_songs == 0 && num_artists == 0) {
        res.send("No search results ");
      }
      //Creating an object to send back to client
      params = {
        tracks: [],
        artists: [],
      };

      // Iterating through each song and adding it to our response JSON
      for (let i = 0; i < num_songs; i++) {
        const title = response.data.tracks.hits[i].track.title;
        const songId = response.data.tracks.hits[i].track.key;
        const imageLink = response.data.tracks.hits[i].track.images.coverart;
        const artist = response.data.tracks.hits[i].track.subtitle;
        params["tracks"].push({
          title: title,
          SongId: songId,
          artist: artist,
          imageLink: imageLink,
        });
      }

      console.log(response.data.artists.hits[0]);
      // Iterating through each artist and adding it to our response JSON
      for (let i = 0; i < num_artists; i++) {
        const avatar_image_link = response.data.artists.hits[i].artist.avatar;
        const artist_name = response.data.artists.hits[i].artist.name;
        params["artists"].push({
          avatar_image_link: avatar_image_link,
          artist_name: artist_name,
        });
      }

      console.log("params", params);
      // res.send(params);
      res.render("pages/search", params);
    })
    .catch(function (error) {
      console.error(error);
      res.send(error.message);
    });
});

// Route to get songs data stored in our database
app.get("/get_song", (req, res) => {
  console.log("get_song route");

  const query = "SELECT * FROM songs;";
  values = [req.body];
  db.one(query, values)
    .then(async (data) => {
      console.log("data is", data);
      res.send(data);
    })
    .catch((err) => {
      console.log(err);
      res.send("error");
    });
});

//Route to view songs database
app.get("/songs_db", (req, res) => {
  console.log("get_song route");

  const query = "SELECT * FROM songs;";
  values = [req.body];
  db.any(query, values)
    .then(async (data) => {
      console.log("data is", data);
      res.send(data);
    })
    .catch((err) => {
      console.log(err);
      res.send("error");
    });
});

//Route to view transactions database
app.get("/transactions_db", (req, res) => {
  console.log("transactions_db route");

  const query = "SELECT * FROM transactions;";
  values = [req.body];
  db.any(query, values)
    .then(async (data) => {
      console.log("data is", data);
      res.send(data);
    })
    .catch((err) => {
      console.log(err);
      res.send("error");
    });
});

//Route to view songs database
app.get("/universities_db", (req, res) => {
  console.log("universities db route");

  const query = "SELECT * FROM universities;";
  values = [req.body];
  db.any(query, values)
    .then(async (data) => {
      console.log("data is", data);
      res.send(data);
    })
    .catch((err) => {
      console.log(err);
      res.send("error");
    });
});

//Route to add a song to the database
// Must send all data necessary to the route in body
app.get("/add_song", async (req, res) => {
  console.log("add_song route");

  // Setting vars
  const song_id = req.query.song_id;
  const title = req.query.title;
  const image_link = req.query.image_link;
  const artist = req.query.artist;
  const username = req.query.username;

  // CHecking if songs exists yet in our db
  const existenceQuery = "SELECT * FROM songs WHERE song_id = $1;";
  songExists = await db.any(existenceQuery, [req.query.song_id]);
  console.log(songExists);

  // If song doesn't exist yet in the database we add it
  if (songExists.length == 0) {
    console.log("song being added to song db");

    songValues = [song_id, title, image_link, artist];
    console.log(songValues);

    const query =
      "INSERT INTO songs (song_id, title, image_link, artist) VALUES ($1, $2, $3, $4);";
    await db.query(query, songValues);
  }
  // If song already exists, don't try to add it
  else {
    console.log("song already exists in db");
  }

  // updating transactions table
  //Creating a var Date to load into the db
  let currentDate = new Date();
  console.log("date", currentDate);
  currentDate.toISOString().split("T")[0];
  console.log("date", currentDate);

  const transactionQuery =
    "INSERT INTO transactions (song_id, username) VALUES ($1, $2);";
  transactionValues = [song_id, username];
  await db.query(transactionQuery, transactionValues);
  res.send("Added song to db");
});

//Route to see the top songs at universities
app.get("/university_chart", (req, res) => {
  console.log("university chart route");

  // Getting data from request
  const university_id = req.query.university_id;
  const limit = req.query.limit;
  const time = req.query.time;

  const query =
    "SELECT songs.title, songs.image_link, COUNT (songs.title) AS popularity_score FROM transactions LEFT JOIN users ON users.username = transactions.username LEFT JOIN songs ON songs.song_id = transactions.song_id WHERE university_id = $1 AND transactions.load_timestamp BETWEEN NOW() - INTERVAL $2 AND NOW() GROUP BY(songs.title, songs.image_link) ORDER BY(popularity_score) DESC LIMIT $3;";
  values = [university_id, time, limit];
  db.any(query, values)
    .then(async (data) => {
      console.log("data::::", data);
      // res.send(data);
      res.render("pages/top_songs", { data: data });
    })
    .catch((err) => {
      console.log(err);
      res.send("error");
    });
});

// 9
// Authentication Middleware.
const auth = (req, res, next) => {
  console.log(req.session);
  if (!req.session.user) {
    // Default to register page.
    return res.render("pages/register");
  }
  next();
};

// Authentication Required
app.use(auth);

app.listen(3000);
console.log("Server is listening on port 3000");
