import {} from 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import Music from "../Musicejs/models/music.js";
import User from "../Musicejs/models/user.js";
import ejs from "ejs";
import passport from "passport";
import session from "express-session";
import passportLocalMongoose  from "passport-local-mongoose";


// App config
const port = process.env.PORT || 4000;
const app= express();
// MiddleWares 

app.set('view engine', 'ejs');
mongoose.set('useCreateIndex', true);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(
   session({ secret: 'blingbling', 
   resave: false, 
   saveUninitialized: false ,
   cookie: { maxAge: 60000 }
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Db Config 
mongoose.connect(
    ` mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sytsn.mongodb.net/musicDB`,
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    },
    (err)=>{
        if(err) throw err;
        console.log("DB Connected Successfully");
    }
  );

  

//   Endpoints set up 
app.get("/",  function(req,res){

   

    if (req.isAuthenticated()) {
        var str=req.user.username;
        var nameMatch = str.match(/^([^@]*)@/);
        var name = nameMatch ? nameMatch[1] : null;
        Music.find( function(err, result){
            if(err){
                res.send(err)
            }else{
                
                res.render("index" , 
                {
                    musics: result,
                    isLoggedIn: req.isAuthenticated(),
                    user: name
                })
               
            }
        }).limit(8)
        }
        else {
            Music.find( function(err, result){
                if(err){
                    res.send(err)
                }else{
                    
                    res.render("index" , 
                    {
                        musics: result,
                        isLoggedIn: req.isAuthenticated()
                    })
                }
            }).limit(2)

        }

   
   
})

app.post("/login", (req,res,next)=> {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err) {
        if (err) {
             return next(err);
             } else{
                passport.authenticate("local")(req,res, function(){
                    console.log("User Login sucessfully")
                    res.redirect("/");
                })
             }
        
      });
})





app.post("/musiques", (req,res)=>{
     const music= req.body;
    Music.create(music, function(err,result){
        if(err){
            res.send(err)
        }else{
            res.send(result)
        }
    })

})
app.get("/musiques", (req,res)=>{
    if (req.isAuthenticated()){
        Music.find( function(err, result){
            if(err){
                res.send(err)
            }else{
                
                res.render("musiques",{
                    musics: result,
                    isLoggedIn: req.isAuthenticated()
                });
            }
        })
    

    } else {
        res.redirect("/")
    }

  

})
app.get("/register", (req,res,next)=>{
    if (req.isAuthenticated()){
        return next();
        }
        else{
            res.render("register", {
                isLoggedIn: req.isAuthenticated()
            })
        }
    
            
  
} )
app.get("/login", (req,res,next)=>{
    if (req.isAuthenticated()){
        return next();
    }
    else{
        res.render("login", {
            isLoggedIn: req.isAuthenticated()
        });
    }
        
       
 } )


app.get("/musiques/:musique", (req, res,next)=> {
    Music.findOne({_id:req.params.musique}, (err,result)=>{
        if(!result){
            console.log(err);
        }else{
            // res.send(result);
             res.render("singlemusique", {
                 name : result.artisteName,
                 title: result.songTitle,
                 url: result.url,
                 description: result.description,
                 user: req.user,
                 isLoggedIn: req.isAuthenticated()
             })
        }
        
           } )
})



app.post("/register", (req,res,next)=>{
   
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect("/register");
         }
         else {
             passport.authenticate("local")(req,res, function(){
                 console.log("User register successfully")
                 res.redirect("/");
             })
         }
    
      });
    

})
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });
// app.delete("/musiques", (req,res)=>{
 
// })
app.listen(port, function() {
    console.log(`Server started on port ${port}`);
  });
  