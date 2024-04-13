import mongoose from "mongoose";

const dataSchema = {
    username:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    matches_played:{
        type:Number,
        required:true,
    },
    matches_won:{
        type:Number,
        required:true,
    },
    score:{
        type:Number,
        required:true,
    }
}

const userSchema = mongoose.Schema(dataSchema);


/*
username : string
    email : string
    password: string
    matches_played: int
    Matches_won: int
    score: int
*/

export const User = mongoose.model('User',userSchema);