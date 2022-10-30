const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');
var querystring = require('querystring');
const { URLSearchParams } = require('url');

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




var client_id = '01ae3dd2c72e46ed93ff6e019e9b387d';
var client_secret = '';
var state = 'fdsgfdsgrwv';

app.get('/', (req, res) =>{
    console.log('/ route');
    res.send('home');
});

app.get('/callback', (req, res) => {
    client_secret = req.query.code;
    console.log(req.query.code);
    
    res.send('callback');
  });




app.get('/login', (req, res) => {

    var state = "dfsgfdsgfdsgf";
    var scope = 'user-read-private user-read-email';
    var redirect_uri = 'http://localhost:3000/callback';

    params = {
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    };

    console.log('https://accounts.spotify.com/authorize?' + new URLSearchParams(params).toString());
    res.redirect('https://accounts.spotify.com/authorize?' + new URLSearchParams(params).toString());
    
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