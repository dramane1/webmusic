import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import passportLocalMongoose  from "passport-local-mongoose";
// db for Admin login 

const adminSchema = new mongoose.Schema ({
    username:{
        type:String,
        required: true
    },
    password:{
        type: String,
        require: true
    }
 });

 

 
const   Admin = mongoose.model("admin", adminSchema);

export default Admin;