import { createTransport } from "nodemailer";
import bcrypt from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import axios from "axios";
import rateLimit from "express-rate-limit";

const transport = createTransport({
  host: process.env.SMTP_SERVER,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.PASSWD,
  },
});

export const googleRecaptcha = async (req: any, res: any, next: any) => {
  const token = req.body.recaptcha_token;

  if (typeof token === "undefined") {
    return res.status(401).json({
      success: false,
      message: "Google recaptcha Failed",
      data: {},
    });
  }

  const secret_key = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
  const googleRecaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${token}`;

  const resp = await axios.get(googleRecaptchaUrl);

  if (resp.data["success"]) {
    next();
  } else {
    console.log(resp.data);

    return res.status(401).json({
      success: false,
      message: "Google recaptcha Failed",
      data: {},
    });
  }
};

// this function blacklist malicious brute force request
export const rateLimiting = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  max: 200,
  message: '{"message":"Exceeded Request Limit" , "success":false,"data":{}}',
  headers: true,
});

const convertToIndianTime = (timeNow) => {
  const currentOffset = timeNow.getTimezoneOffset();

  const ISTOffset = 330; // IST offset UTC +5:30

  var ISTTime = new Date(
    timeNow.getTime() + (ISTOffset + currentOffset) * 60000
  ).toLocaleTimeString();

  return ISTTime;
};

export const hashPassword = async (password: any) => {
  const hash = await bcrypt.hash(password, 10);
  return hash;
};

export const comparePassword = async (password: any, hashedPassword: any) => {
  const isSame = await bcrypt.compare(password, hashedPassword);
  return isSame;
};

export const sendMail = async (
  subject: any,
  email: any,
  otp: any,
  validTill: any,
  createdAt: any,
  message: any
) => {

  let result = false 

  await transport.sendMail(
    {
      from: "admin@istaceg.in",
      to: email,
      subject: subject,
      html: `
            <div>
            
            <p> Otp is valid for 120 seconds </p>

            <p>${message}</p>

            <p> Created at : ${convertToIndianTime(createdAt)} </p>

            <p> Valid Till : ${convertToIndianTime(validTill)} </p> 
            
            <h2> OTP : ${otp} </h2>
            
            </div>
          `,
    },
    
    (error, info) => {
      if (error) {
        console.log("Error: ", error, "mail", email);
        result = false ;
      }

      else if (info.accepted){
        result = true ;
      } 
      else 
       result = false;
    }
  );

  return result ;
};

export async function verifyToken(token: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    try {
      let load = verify(token, "key123");
      //@ts-ignore
      if (
        load != undefined &&
        //@ts-ignore
        load.email != undefined &&
        //@ts-ignore
        load.email != null &&
        //@ts-ignore
        load.email != ""
      ) {
        //@ts-ignore
        return resolve(load);
      }
      return reject(null);
    } catch (e) {
      console.log(e);
      //@ts-ignore
      return reject(null);
    }
  });
}

export const generateToken = async (data: any, expiresIn: string) => {
  return sign(data, "key123", {
    expiresIn: expiresIn,
  });
};
