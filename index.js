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


app.get('/', (req, res) =>{
    console.log('/ route');
    res.send('home');
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
app.get('/login', (req, res) => {
    console.log('/login route');

    // should be a random number. For our purposes, this should be fine
    var state = "superrandomnumber";
    var scope = 'user-read-private user-read-email';

    params = {
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI,
        state: state
    };

    // redirecting to spotify authorize endpoint to get a verification code
    console.log('https://accounts.spotify.com/authorize?' + new URLSearchParams(params).toString());
    res.redirect('https://accounts.spotify.com/authorize?' + new URLSearchParams(params).toString());
    
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
        //Checking to make sure there are results being sent backg an object to send back to client
        params = {
            tracks: []
        };
        // Iterating through each song and adding it to our respons JSON
        for (let i = 0; i < limit; i++){
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