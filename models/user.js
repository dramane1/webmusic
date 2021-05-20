import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import passportLocalMongoose  from "passport-local-mongoose";
// db for user registration and login

const userSchema = new mongoose.Schema ({
    username:String,
    password: String
 });

 
 userSchema.plugin(passportLocalMongoose);
 
const   User = mongoose.model("User", userSchema);

export default User;