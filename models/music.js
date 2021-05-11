import express from "express";

import mongoose from "mongoose";

 
const musicShema = new mongoose.Schema ({
    artisteName: String ,
    songTitle: String,
    description: String,
    url: String,
    img: String
});

const Music = mongoose.model("Music", musicShema);

export default Music;
