const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { URLSearchParams } = require('url');
const { resolveNaptr } = require('dns');

// database configuration
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};
  
const db = pgp(dbConfig);

// test your database
db.connect()
.then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
})
.catch(error => {
    console.log('ERROR:', error.message || error);
});


app.set('view engine', 'ejs');

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
var access_token = '';
var refresh_token = '';


app.get("/", (req, res) => {
  // console.log("/ route");
  // res.send('home');
  res.render("pages/index"); // index is the first/welcome page for the / route
});

app.get("/home", (req, res) => {
  // console.log("/ route");
  // res.send('home');
  res.render("pages/home");
});

app.get("/login", (req, res) => {
  // console.log("/login");
  // res.send('home');
  res.render("pages/login");
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const query = `SELECT * FROM users2 WHERE username = '${username}';`;
  // console.log("req body", req.body);

  db.any(query)
    .then(async (data) => {
      if (data.length > 0) {
        // console.log("data@", data[0]);
        const match = await bcrypt.compare(req.body.password, data[0].password); //await is explained in #8

        if (!match) {
          return console.log("Incorrect username or password.");
        } else {
          req.session.user = {
            api_key: process.env.API_KEY,
          };
          req.session.save();
          res.redirect("/discover");
        }
      } else {
        res.redirect("/register");
      }
    })
    .catch(function (err) {
      console.log("Error in logging in,", err);
      res.render("pages/login");
    });
});

app.get("/register", (req, res) => {
  // console.log("/login");
  // res.send('home');
  res.render("pages/register");
});

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const hash = await bcrypt.hash(req.body.password, 10);

  const query = `INSERT INTO users2 (username, password) VALUES ('${username}','${hash}');`;
  db.any(query)
    .then((data) => {
      res.redirect("/login");
    })
    .catch(function (err) {
      res.redirect("/register");
    });
});


// Necessary callback route for SPotify API authentication
// SHould not be called directly by client
app.get('/callback', async (req, res) => {
    console.log('/callback route');

    code = req.query.code;
    console.log(req.query.code);

    const authUrl = 'https://accounts.spotify.com/api/token'

    axios({
        url: authUrl,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // From Spotify documentation
            'Authorization': 'Basic ' + (new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        },
        // data must be x-www-urlform-encoded, so it must be turned into a URL search param object
        data: new URLSearchParams( {
            "grant_type":    "authorization_code",
            "code":          code,
            "redirect_uri":  REDIRECT_URI
        }),
    })
    .then(results => {
        // Successful case
        console.log(results.data);
        access_token = results.data.access_token;
        refresh_token = results.data.refresh_token;
        res.send(results.data);
    })
    .catch(err => {
        // Handle errors
        console.log(err);
        res.send('Error. Check console log');
    });
});


// Refresh token route for SPotify API authentication
app.get('/refresh_token', async (req, res) => {
    console.log('/refresh route');

    console.log(refresh_token);

    const refreshUrl = 'https://accounts.spotify.com/api/token'

    axios({
        url: refreshUrl,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // From Spotify documentation
            'Authorization': 'Basic ' + (new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        },
        // data must be x-www-urlform-encoded, so it must be turned into a URL search param object
        data: new URLSearchParams( {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }),
    })
    .then(results => {
        // Successful case
        console.log(results.data);
        access_token = results.data.access_token;
        refresh_token = results.data.refresh_token;
        res.send(results.data);
    })
    .catch(err => {
        // Handle errors
        console.log(err);
        res.send('Error. Check console log');
    });
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
  const q = req.query.q;
  //limiting the number of results
  limit = 10;

  const options = {
    method: "GET",
    url: "https://shazam.p.rapidapi.com/search",
    params: { term: q, locale: "en-US", offset: "0", limit: limit },
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
        artists: []
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

app.get('/search_song', async (req, res) =>{
    console.log('/search route');
    const q = req.query.q;
    //limiting the number of results
    limit = 10

    const options = {
        method: 'GET',
        url: 'https://shazam.p.rapidapi.com/search',
        params: {term: q, locale: 'en-US', offset: '0', limit: limit},
        headers: {
        'X-RapidAPI-Key': '5c60a9f7e5msh6e3e990c63159adp184964jsn0ca34bbc7771',
        'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
        }
    };

    axios.request(options).then(function (response) {
        console.log(response.data);
        // FInding number of songs found
        num_results = Object.keys(response.data).length;
        //Checking to make sure there are results being sent back
        if (num_results == 0){
            res.send('No results');
        }
        //Creating an object to send back to client
        params = {
            tracks: []
        };
        // Iterating through each song and adding it to our respons JSON
        for (let i = 0; i < num_results; i++){
            const title = response.data.tracks.hits[0].track.title
            const key = response.data.tracks.hits[0].track.key
            const imageLink = response.data.tracks.hits[0].track.images.coverart
            const artist = response.data.tracks.hits[0].track.subtitle
            params['tracks'].push({'title': title, 'key': key, 'artist': artist, 'imageLink': imageLink});
        }
        console.log(params);
        res.send(params);
    }).catch(function (error) {
        console.error(error);
        res.send(error.message);
    }); 

});


// 9 
// Authentication Middleware.
// const auth = (req, res, next) => {
//     console.log(req.session);
//     if (!req.session.user) {
//       // Default to register page.
//       return res.render('pages/register');
//     }
//     next();
//   };
  
// Authentication Required
// app.use(auth);




app.listen(3000);
console.log('Server is listening on port 3000');