import {} from 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import Music from "../Musicejs/models/music.js";
import User from "../Musicejs/models/user.js";
import ejs from "ejs";
import passport from "passport";
import session from "express-session";
import passportLocalMongoose from "passport-local-mongoose";
import flash from "connect-flash";
import LocalStrategy from "passport-local";
import MongoStore from 'connect-mongo';

import bcrypt from "bcryptjs"


// App config
const port = process.env.PORT || 4000;
const app = express();

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
                    res.redirect("/login")
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



//   Ensure Authentication
const ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/login');
};
const forwardAuthenticated = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

//   Endpoints set up 
app.get("/", function (req, res) {



    if (req.isAuthenticated()) {
        var str = req.user.username;
        var nameMatch = str.match(/^([^@]*)@/);
        var name = nameMatch ? nameMatch[1] : null;
        Music.find(function (err, result) {
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
        Music.find(function (err, result) {
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

// Login
app.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

// app.post("/login",async(req,res,next)=> {

// const user = new User({
//     username: req.body.username,
//     password: req.body.password
// });
// req.login(user, function(err) {
//     if(req.body.username ='' ){
//         req.flash('failure'," Please usernmae part")
//     }
//     if (err) {
//         //  return next(err);
//          req.flash('failure'," Oups!! Les champs utilisateur et mot de passe ne doivent pas être vides")
//          res.redirect("/login");
//          } else{
//             passport.authenticate("local",
//            {
//             failureRedirect: '/login',
//             successRedirect: '/', 
//             failureFlash: true
//            } 
//             )(req,res, function(){

//                 console.log("User Login sucessfully")
//                 res.redirect("/");

//             })

//          }

//   });
// })
// Only function  


// End oF fUNCTION


app.post("/musiques", (req, res) => {
    const music = req.body;
    Music.create(music, function (err, result) {
        if (err) {
            res.send(err)
        } else {
            res.send(result)
        }
    })

})
app.get("/musiques", (req, res) => {
    if (req.isAuthenticated()) {
        Music.find(function (err, result) {
            if (err) {
                res.send(err)
            } else {

                res.render("musiques", {
                    musics: result,
                    isLoggedIn: req.isAuthenticated()
                });
            }
        })


    } else {
        res.redirect("/")
    }



})


// Login Page
app.get('/login', forwardAuthenticated, (req, res) => res.render('login'));
// app.get("/register", (req,res,next)=>{
//     res.render("register",{
//         isLoggedIn: "",
//         errors:"",
//         user: ""
//     } )
//     // if (req.isAuthenticated()){
//     //     return next();
//     //     }
//     //     else{
//     //         res.render("register", {
//     //             isLoggedIn: req.isAuthenticated()
//     //         })
//     //     }



// } )
// Register Page
app.get('/register', forwardAuthenticated, (req, res) => res.render('register'));
// app.get("/login", (req,res,next)=>{
//     res.render("login",{
//         isLoggedIn: "",
//         errors:"",
//         user: ""
//     })


//     // if (req.isAuthenticated()){
//     //     return next();
//     // }
//     // else{
//     //     res.render("login", {
//     //         isLoggedIn: req.isAuthenticated(),
//     //         errors: req.flash('failure')
//     //     });
//     // }


//  } )


app.get("/musiques/:musique", (req, res, next) => {
    Music.findOne({
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
                user: req.user,
                isLoggedIn: req.isAuthenticated()
            })
        }

    })
})




app.post("/register", async (req, res, next) => {
    const {
        username,
        password
    } = req.body;
    let errors = [];

    if (!username || !password) {
        console.log("enter all fiedls")
        errors.push({
            msg: 'Please enter all fields'
        });
    }


    if (password.length < 6) {
        errors.push({
            msg: 'Password must be at least 6 characters'
        });
        console.log("Password must be at least 6 characters")
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            username,
            password,
        });
    } else {
        User.findOne({
            username: username
        }).then(user => {
            if (user) {
                errors.push({
                    msg: 'Email already exists'
                });
                console.log("Email already exists")
                res.render('register', {
                    errors,
                    username,
                    password,

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
                                console.log("You are now registered and can log in")
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
    // User.register({username:req.body.username}, req.body.password, function(err, user) {
    //     if (err) { 
    //         console.log(err);
    //         res.redirect("/register");
    //      }
    //      else {
    //          passport.authenticate("local")(req,res, function(){
    //              console.log("User register successfully")
    //              res.redirect("/");
    //          })
    //      }

    //   });


})
app.get('/logout', function (req, res) {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
});
// app.delete("/musiques", (req,res)=>{

// })
app.listen(port, function () {
    console.log(`Server started on port ${port}`);
});