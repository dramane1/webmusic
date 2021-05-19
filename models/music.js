import express from "express";

import mongoose from "mongoose";

 
const musicShema = new mongoose.Schema ({
    artisteName: String ,
    songTitle: String,
    description: String,
    url: String,
    img: String
});

export default Music = mongoose.model("Music", musicShema);


// db for user registration and login

const userSchema = new mongoose.Schema ({
   user:String,
   password: String
});

export default User = mongoose.model("User", userSchema);



