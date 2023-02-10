// DOTENV allows the use of environment variable through .env for use with encryption
require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ['password'],
    excludeFromEncryption: ["email"],
});

const User = new mongoose.model('User', userSchema);


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

    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({ email: username }, (err, foundUser) => {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    if (foundUser.password === password) {
                        res.render('secrets');
                    }
                }
            }
        });
    });

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })

    .post((req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        newUser.save((err) => {
            if (!err) {
                res.render('secrets');
            } else {
                console.log(err);
            }
        });
    });

app.route('/submit')
    .get((req, res) => {
        res.render('submit');
    })

    .post((req, res) => {

    });

// app.route('/secrets')
//     .get((req, res) => {
//         res.render('secrets');
//     })

//     .post((req, res) => {

//     });





























app.listen(3000, (err) => {
    console.log("Server  started on port 3000.");
});