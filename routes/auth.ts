import { Router } from "express";
import {
  signUp,
  verifyOtp,
  resendOtp,
  login,
  verifyResetPassword,
} from "../action";
import { googleRecaptcha, rateLimiting, verifyToken } from "../utils";
import {
  baseValidator,
  loginValidator,
  otpValidator,
  resendOtpValidator,
  signupValidator,
  verifyResetPasswordValidator,
} from "../validators";
// import { loginValidator } from "../validators";

const router = Router();

router.use((req: any, res: any, next: any) => {
  if (req.path === "/verifyToken") {
    next();
  } else {
    res.setHeader("Content-type", "application/json");
    return rateLimiting(req, res, next);
  }
});

router.post(
  "/login",
  loginValidator,
  baseValidator,

  googleRecaptcha,
  async (req: any, res: any) => {
    try {
      const data = await login(req.body);
      res.json(data);
    } catch (err) {
      console.log("ERROR: " + err.message);
      res.json({ success: false, message: "Error", data: {} });
    }
  }
);

router.post(
  "/signup",
  signupValidator,
  baseValidator,
  googleRecaptcha,
  async (req: any, res: any) => {
    try {
      const data = await signUp(req.body);
      res.json(data);
    } catch (err) {
      console.log("ERROR: " + err.message);
      res.json({ success: false, message: "Error", data: {} });
    }
  }
);

router.post(
  "/verifyOtp",
  otpValidator,
  baseValidator,
  googleRecaptcha,
  async (req: any, res: any) => {
    try {
      console.log("request came", req.query);
      const data = await verifyOtp(req.body);
      res.json(data);
    } catch (err) {
      console.log("ERROR: " + err.message);
      res.json({ success: false, message: "Error", data: {} });
    }
  }
);

router.post(
  "/resendOtp",
  resendOtpValidator,
  baseValidator,
  googleRecaptcha,
  async (req: any, res: any) => {
    try {
      console.log("request came", req.query);
      const data = await resendOtp(req.body, "Resending OTP");
      res.json(data);
    } catch (err) {
      console.log("ERROR: " + err.message);
      res.json({ success: false, message: "Error", data: {} });
    }
  }
);

export const middleware = (req: any, res: any, next: any) => {
  const token = req.headers["authorization"];

  if (typeof token !== "undefined") {
    const jwt = token.split(" ")[1];
    verifyToken(jwt)
      .then((msg) => {
        // decoded jwt token will be stored here !!
        req.data = msg;
        next();
      })
      .catch((err) => {
        res
          .status(498)
          .json({ success: false, message: "Invalid/Expired JWT", data: {} });
      });
  } else {
    res
      .status(498)
      .json({ success: false, message: "Token Not Found", data: {} });
  }
};

router.post(
  "/resetPasswordOtp",
  resendOtpValidator,
  baseValidator,
  googleRecaptcha,
  async (req: any, res: any) => {
    try {
      const data = await resendOtp(req.body, "OTP for Reseting password");
      res.json(data);
    } catch (err) {
      console.log("ERROR: " + err.message);
      res.json({ success: false, message: "Operation failed", data: {} });
    }
  }
);

router.post(
  "/verifyResetPassword",
  verifyResetPasswordValidator,
  baseValidator,
  googleRecaptcha,
  async (req: any, res: any) => {
    try {
      const data = await verifyResetPassword(req.body);
      res.json(data);
    } catch (err) {
      console.log("ERROR: " + err.message);
      res.json({ success: false, message: "Operation failed", data: {} });
    }
  }
);

router.get("/verifyToken", middleware, (req, res) => {
  res.json({ success: true, message: "JWT Verified", data: req.data });
});

export default router;
