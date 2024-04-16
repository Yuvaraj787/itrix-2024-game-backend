import { body } from "express-validator";

export const loginValidator = async (req, res, next) => {
  body("email").isEmail().notEmpty().withMessage("email is empty");

  body("passord").isString().notEmpty().withMessage("password is empty");

  next();
};
