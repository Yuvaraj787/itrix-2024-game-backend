import { Router } from "express";
import { signUp, verifyOtp, resendOtp, login, verifyResetPassword } from "../action";
import { body } from "express-validator";

import { verifyToken } from "../utils";
import { loginValidator } from "../validators";

const router = Router();

router.post(
  "/login",

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

router.post("/signup", async (req: any, res: any) => {
  try {
    const data = await signUp(req.body);
    res.json(data);
  } catch (err) {
    console.log("ERROR: " + err.message);
    res.json({ success: false, message: "Error", data: {} });
  }
});

router.post("/verifyOtp", async (req: any, res: any) => {
  try {
    console.log("request came", req.query);
    const data = await verifyOtp(req.body);
    res.json(data);
  } catch (err) {
    console.log("ERROR: " + err.message);
    res.json({ success: false, message: "Error", data: {} });
  }
});

router.post("/resendOtp", async (req: any, res: any) => {
  try {
    console.log("request came", req.query);
    const data = await resendOtp(req.body, "Resending OTP");
    res.json(data);
  } catch (err) {
    console.log("ERROR: " + err.message);
    res.json({ success: false, message: "Error", data: {} });
  }
});

export const middleware = (req: any, res: any, next: any) => {
  const token = req.headers["authorization"];

  if (typeof token !== "undefined") {
    const jwt = token.split(" ")[1];
    verifyToken(jwt)
      .then((msg) => {
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

router.post("/resetPasswordOtp", async (req: any, res: any) => {
  try {
    const data = await resendOtp(req.body, "OTP for Reseting password");
    res.json(data);
  } catch (err) {
    console.log("ERROR: " + err.message);
    res.json({ success: false, message: "Operation failed", data: {} });
  }
});

router.post("/verifyResetPassword", async (req: any, res: any) => {
  try {
    const data = await verifyResetPassword(req.body)
    res.json(data);
  } catch (err) {
    console.log("ERROR: " + err.message);
    res.json({ success: false, message: "Operation failed", data: {} });
  }
});

router.get("/verifyToken", middleware, (req, res) => {
  res.json({ success: true, message: "JWT Verified", data: req.data });
});

/*
 need to do reset password , 
 convert to mongoose ,
 adding validator 
*/

export default router;
