import {} from 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import {Music , User} from "../Musicejs/models/music.js";

import ejs from "ejs";
import passport from "passport";
import session from "express-session";
import passportLocalMongoose  from "passport-local-mongoose";


// App config
const port = process.env.PORT || 4000;
const app= express();
// MiddleWares 

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static("public"));

app.use(
    { secret: 'blingbling', 
    resave: false, 
    saveUninitialized: false 
});
app.use(passport.initialize());
app.use(passport.session());

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
app.get("/", function(req,res){
    Music.find( function(err, result){
        if(err){
            res.send(err)
        }else{
            
            res.render("index" , {musics: result})
        }
    }).limit(8)
   
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
    Music.find( function(err, result){
        if(err){
            res.send(err)
        }else{
            
            res.render("musiques",{musics: result});
        }
    })
})

app.get("/musiques/:musique", (req, res)=> {
   
    Music.findOne({_id:req.params.musique}, (err,result)=>{
        if(!result){
            console.log(err);
        }else{
            // res.send(result);
             res.render("singlemusique", {
                 name : result.artisteName,
                 title: result.songTitle,
                 url: result.url,
                 description: result.description
             })
        }
        
        

    } )
   
})

app.post("/register", (req,res)=>{
    const user= req.body;
    User.create(user, function(err,result){
        if(err){
            res.send(err)
        }else{
            res.send(result)
        }
    })
    

})
// app.delete("/musiques", (req,res)=>{
 
// })
app.listen(port, function() {
    console.log(`Server started on port ${port}`);
  });
  