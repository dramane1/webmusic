import {} from 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import Music from "./models/music.js"
import User from "./models/user.js";
import Admin from "./models/admin.js";
import ejs from "ejs";
import passport from "passport";
import session from "express-session";
import passportLocalMongoose from "passport-local-mongoose";
import flash from "connect-flash";
import LocalStrategy from "passport-local";
import MongoStore from 'connect-mongo';
import {check,validationResult } from 'express-validator';
import bcrypt from "bcryptjs"
import AdminBro from "admin-bro";
import  AdminBroExpress from "@admin-bro/express";
import {} from "tslib";
import AdminBroMongoose from "admin-bro-mongoose";
import mongoosePaginate from "mongoose-paginate-v2";


// App config
const port = process.env.PORT || 4000;
const app = express();
app.use(express.json())

// ADmin config 
AdminBro.registerAdapter(AdminBroMongoose)

const adminBro = new AdminBro({
  databases: [mongoose],
  rootPath: '/admin',
  resources: [User,Admin,Music]
})

const ADMIN = {
  email: process.env.ADMIN_EMAIL || 'email@gmail.com',
  password: process.env.ADMIN_PASSWORD || '1234',
}

const router = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
  cookieName: process.env.ADMIN_COOKIE_NAME || 'admin-bro',
  cookiePassword: process.env.ADMIN_COOKIE_PASS || 'supersecret-and-long-password-for-a-cookie-in-the-browser',
  authenticate: async (email, password) => {
    if (email === ADMIN.email && password === ADMIN.password) {
      return ADMIN
    }
    return null
  }
})
app.use(adminBro.options.rootPath, router)



// MiddleWares 

app.set('view engine', 'ejs');
mongoose.set('useCreateIndex', true);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


// Db Config 
mongoose.connect(
    ` mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sytsn.mongodb.net/musicDB`, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    },
    (err) => {
        if (err) throw err;
        console.log("DB Connected Successfully");
    }
);

app.use(
    session({
        secret: 'blingbling',
        resave: true,
        saveUninitialized: true,
        cookie: {
            maxAge: 60000
        },
        store: MongoStore.create({
            mongoUrl: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sytsn.mongodb.net/musicDB`,
            dbName: 'musicDB'
        })
    })
)


app.use(passport.initialize());
app.use(passport.session());


// passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.use(
    new LocalStrategy({}, (username, password, done) => {
        // Match user
        User.findOne({
            username: username
        }).then(user => {
            if (!user) {
                return done(null, false, {
                    message: 'That email is not registered'
                });
                req.flash("error_msg",'That email is not registered')
                res.redirect("/login")
            }

            // Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Password incorrect'
                    });
                    req.flash("error_msg",'Password incorrect')
                   return  res.redirect("/login")
                }
            });
        });
    })
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


app.use(flash())
// Global variables
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});



//   Ensure Authentication Custom Function 
const ensureAuthenticated = async function (req, res, next) {
    
    if (req.isAuthenticated()) {
     
        return next();
    }
    req.flash('error_msg', 'Veuillez vous connecter pour profiter de nos fonctionnalités');
    res.redirect('/login');
};
const forwardAuthenticated =async function (req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

//   Endpoints set up 

//  Display home Page
app.get("/", async function (req, res) {



    if (req.isAuthenticated()) {
        var str = req.user.username;
        var nameMatch = str.match(/^([^@]*)@/);
        var name = nameMatch ? nameMatch[1] : null;
      await  Music.find(function (err, result) {
            if (err) {
                res.send(err)
            } else {

                res.render("index", {
                    musics: result,
                    isLoggedIn: req.isAuthenticated(),
                    user: name
                })

            }
        }).limit(8)
    } else {
      await  Music.find(function (err, result) {
            if (err) {
                res.send(err)
            } else {

                res.render("index", {
                    musics: result,
                    isLoggedIn: req.isAuthenticated()
                })
            }
        }).limit(2)

    }



})

// Register Post Route 

app.post("/register", (req, res, next) => {
    // [ check('password').not().isEmpty().isLength({min: 6}).withMessage('error_msg','Password must have more than 6 characters')],
    const {
        username,
        password
    } = req.body;
    let errors = [];

    // const error = validationResult(req);
    // errors.push(error);

    if (!username || !password) {
        console.log("enter all fiedls")
      errors.push({
            msg: 'Veuillez saisir tous les champs'
        });
    }


    if (password.length < 6) {
        errors.push({
            msg: 'Le mot de passe doit être au moins de 6 caractères'
        });
        // console.log("Password must be at least 6 characters")
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            username,
            password,
            isLoggedIn: ""
        });
    } else {
        User.findOne({
            username: username
        }).then(user => {
            if (user) {
                errors.push({
                    msg: 'Email already exists'
                });
                // console.log("Email already exists")
                res.render('register', {
                    errors,
                    username,
                    password,
                    isLoggedIn: ""
                });
            } else {
                const newUser = new User({
                    username,
                    password
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser
                            .save()
                            .then(user => {
                               // console.log("You are now registered and can log in")
                                req.flash(
                                    'success_msg',
                                    'You are now registered and can log in'
                                );
                                res.redirect('/login');
                            })
                            .catch(err => console.log(err));
                    });
                });
            }
        });
    }

})
// Register Page || view 
app.get('/register', forwardAuthenticated, (req, res) => res.render('register',{
  
    isLoggedIn: "",
    user: " "
}));


// Login post route 
app.post('/login', async(req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

// Login Page || view 
app.get('/login', forwardAuthenticated, (req, res) => res.render('login',
{
    isLoggedIn: "",
    user: " "
}));

// Uplaod musics
app.post("/musiques", async(req, res) => {
    const music = req.body;
   await Music.create(music, function (err, result) {
        if (err) {
            res.send(err)
        } else {
            res.send(result)
        }
    })

})
// Display all music
app.get("/musiques", ensureAuthenticated,(req, res) => {
    var str = req.user.username;
    var nameMatch = str.match(/^([^@]*)@/);
    var name = nameMatch ? nameMatch[1] : null;
       
        Music.find(function (err, result) {
            if (err) {
                res.send(err)
            } else {

                res.render("musiques", {
                    musics: result,
                    isLoggedIn: req.isAuthenticated(),
                    user: name,
                });
            }
        })
})

// Display Single Musique

app.get("/musiques/:musique", async(req, res, next) => {
    if(req.isAuthenticated() ){
        var str = req.user.username;
        var nameMatch = str.match(/^([^@]*)@/);
        var name = nameMatch ? nameMatch[1] : null;
     await  Music.findOne({
            _id: req.params.musique
        }, (err, result) => {
            if (!result) {
                console.log(err);
            } else {
                // res.send(result);
                res.render("singlemusique", {
                    name: result.artisteName,
                    title: result.songTitle,
                    url: result.url,
                    description: result.description,
                    user: name,
                    isLoggedIn: req.isAuthenticated()
                })
            }
    
        })
    } else{
      await  Music.findOne({
            _id: req.params.musique
        }, (err, result) => {
            if (!result) {
                console.log(err);
            } else {
                // res.send(result);
                res.render("singlemusique", {
                    name: result.artisteName,
                    title: result.songTitle,
                    url: result.url,
                    description: result.description,
                    user: "",
                    isLoggedIn: ""
                })
            }
    
        })
    }
    
})


app.get('/logout', function (req, res) {
    req.logout();
    req.flash('success_msg', 'Vous êtes déconnecté');
    res.redirect('/login');
});
// app.delete("/musiques", (req,res)=>{

// })
app.listen(port, function () {
    console.log(`Server started on port ${port}`);
});