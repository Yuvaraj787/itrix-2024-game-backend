import { Router } from "express";
import {User} from "../models/userModel.js"
const router = Router()

router.get("/",(req,res)=>{
    return res.send("sucess");
})

router.post("/",async (req,res)=>{

    


    return res.json({success: true})
})

export default router;