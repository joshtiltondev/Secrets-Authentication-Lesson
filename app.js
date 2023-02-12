// DOTENV allows the use of environment variable through .env for use with encryption
require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},

    // callback: accessToken = allows us to get user data; profile = contains email, id, etc...; 
    function (accessToken, refreshToken, profile, cb) {

        // findOrCreate() = finds a user under the specified id or creates a new user
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.route('/')
    .get((req, res) => {
        res.render('home');
    })

    .post((req, res) => {

    });

app.route('/login')
    .get((req, res) => {
        res.render('login');
    })

    .post(passport.authenticate('local', {
        successRedirect: '/secrets', failureRedirect: '/login'
    }));

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })

    .post((req, res) => {
        User.register({ username: req.body.username }, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect('/register');
            }
            else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/secrets');
                });
            }
        });
    });

app.route('/submit')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('submit');
        } else {
            res.redirect('/login');
        }
    })

    .post((req, res) => {
        const submittedSecret = req.body.secret;
        User.findById(req.user.id, (err, user) => {
            user.secret = submittedSecret;
            user.save(() => {
                res.redirect('/secrets');
            });
        });
    });

app.route('/secrets')
    .get((req, res) => {
        User.find({ 'secret': { $ne: null } }, (err, foundUsers) => {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("secrets", { usersWithSecrets: foundUsers });
                }
            }
        });
    })

    .post((req, res) => {
    });

app.route('/logout')
    .get((req, res) => {
        req.logout(function (err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
    });

// google authentication routes
app.route('/auth/google')
    .get(passport.authenticate('google', { scope: ['profile'] }));

app.route('/auth/google/secrets')
    .get(passport.authenticate('google', { failureRedirect: '/login' }),
        function (req, res) {
            // Successful authentication, redirect home.
            res.redirect('/secrets');
        });















app.listen(3000, (err) => {
    console.log("Server  started on port 3000.");
});