import { body, validationResult } from "express-validator";

export const baseValidator = async (req, res, next) => {
  const errors = validationResult(req);

  const formattedErrors = errors.array().map((error) => error.msg);
  const errorMessage = {
    message: formattedErrors.join(" , "),
    success: false,
    data: {},
  };

  if (!errors.isEmpty()) {
    return res.send(errorMessage);
  } else next();
};

export const loginValidator = async (req, res, next) => {
  await body("email")
    .notEmpty()
    .withMessage("email is empty")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email")
    .run(req);
  await body("password").notEmpty().withMessage("Password is empty").run(req);


  next();
};

export const signupValidator = async (req, res, next) => {
  await body("email")
    .notEmpty()
    .withMessage("email is empty")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email")
    .run(req);

  await body("password")
    .isString()
    .notEmpty()
    .withMessage("password is empty")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false,
      pointsPerUnique: 1,
      pointsPerRepeat: 0.5,
      pointsForContainingLower: 10,
      pointsForContainingUpper: 10,
      pointsForContainingNumber: 10,
      pointsForContainingSymbol: 10,
    })
    .withMessage(
      "password need to have 1 lower,1 upper,1 number,1 symbol and min.length 8"
    )
    .run(req);

  await body("name")
    .trim()
    .isString()
    .notEmpty()
    .withMessage("name is empty")
    .run(req);

  // await body("recaptcha_token")
  //   .isString()
  //   .notEmpty()
  //   .withMessage("google recaptcha not found")
  //   .run(req);

  next();
};

export const otpValidator = async (req, res, next) => {
  await body("email")
    .notEmpty()
    .withMessage("email is empty")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email")
    .run(req);

  await body("otp").notEmpty().withMessage("otp not found").run(req);

  // await body("recaptcha_token")
  //   .isString()
  //   .notEmpty()
  //   .withMessage("google recaptcha not found")
  //   .run(req);

  next();
};

export const resendOtpValidator = async (req, res, next) => {
  await body("email")
    .notEmpty()
    .withMessage("email is empty")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email")
    .run(req);
    
  // await body("recaptcha_token")
  //   .isString()
  //   .notEmpty()
  //   .withMessage("google recaptcha not found")
  //   .run(req);

  next();
};

export const verifyResetPasswordValidator = async (req, res, next) => {
  await body("email")
    .notEmpty()
    .withMessage("email is empty")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email")
    .run(req);

  await body("password")
    .isString()
    .notEmpty()
    .withMessage("password is empty")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false,
      pointsPerUnique: 1,
      pointsPerRepeat: 0.5,
      pointsForContainingLower: 10,
      pointsForContainingUpper: 10,
      pointsForContainingNumber: 10,
      pointsForContainingSymbol: 10,
    })
    .withMessage(
      "password need to have 1 lower,1 upper,1 number,1 symbol and min.length 8"
    )
    .run(req);

  // await body("recaptcha_token")
    // .isString()
    // .notEmpty()
    // .withMessage("google recaptcha not found")
    // .run(req);

  next();
};
