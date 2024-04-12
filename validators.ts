import { body } from "express-validator";

export const loginValidator = async(req,res,next)=>{

    body("email").isEmail().notEmpty()

    body("password").isString().notEmpty()

    next()

}