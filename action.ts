import { createTransport } from "nodemailer";
import { google } from "googleapis";
import clientPromise from "./mongodb";
import {
  sendMail,
  comparePassword,
  hashPassword,
  generateToken,
} from "./utils";

const transport = createTransport({
  host: process.env.SMTP_SERVER,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.PASSWD,
  },
});

/*
  Description : Create new User 
  Method : POST 
  data : { name  ,email , password }
*/
export async function signUp(data: any) {
  const { name, email, password } = data;

  const db = (await clientPromise).db("itrix");

  const users = db.collection("users");

  const isUserExist = await users.findOne({
    email,
  });

  if (isUserExist) {
    return {
      success: false,
      message: "User Already exists",
      data: {},
    };
  }

  const hashedPassword = await hashPassword(password);

  const otp = Math.floor(100000 + Math.random() * 900000);

  // send mail
  const timeNow = new Date();

  timeNow.setSeconds(timeNow.getSeconds() + 120);

  await sendMail("Auction Game - OTP", email, otp, timeNow, new Date(),"");

  await users.insertOne({
    name,
    email,
    password: hashedPassword,
    isVerified: false,
    otp,
    validTill: timeNow,
    bought_passes: [],
  });

  return {
    success: true,
    message: "Check Mail for otp",
    data: {},
  };
}

/*
  Description : verify OTP  
  Method : POST 
  data : {email , otp }
*/
export async function verifyOtp(data: any) {
  const { email, otp } = data;

  const db = (await clientPromise).db("itrix");

  const users = db.collection("users");

  const isUserExist = await users.findOne({
    email,
  });

  if (!isUserExist) {
    return {
      success: false,
      message: "Please Signup First",
      data: {},
    };
  }

  if (isUserExist.isVerified) {
    return {
      success: false,
      message: "User already verified",
      data: {},
    };
  }

  if (Number(otp) === Number(isUserExist.otp)) {
    const validTime = new Date(isUserExist.validTill).getTime();

    const currentTime = new Date().getTime();

    if (validTime >= currentTime) {
      await users.updateOne(
        {
          email,
        },
        {
          $set: {
            otp: -1,
            isVerified: true,
          },
        }
      );
      return {
        success: true,
        message: "OTP Verified",
        data: {},
      };
    }
  }

  return {
    success: false,
    message: "Not Valid OTP",
    data: {},
  };
}

/*
  Description : Resending OTP
  Method : POST 
  data : { email }
*/
export async function resendOtp(data: any, message: any) {
  const email = data.email;

  const db = (await clientPromise).db("itrix");

  const users = db.collection("users");

  const user = await users.findOne({
    email,
  });

  if (!user) {
    return {
      success: false,
      message: "Please Signup First",
      data: {},
    };
  }

  if (user.isVerified && message !== "OTP for Reseting password") {
    return {
      success: false,
      message: "User already verified",
      data: {},
    };
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  // send mail
  const timeNow = new Date();

  timeNow.setSeconds(timeNow.getSeconds() + 120);

  await sendMail(
    "Auction Game - New OTP",
    email,
    otp,
    timeNow,
    new Date(),
    message
  );

  await users.updateOne(
    {
      email,
    },
    {
      $set: { otp, validTill: timeNow },
    }
  );

  return {
    success: true,
    message: "Check Mail",
    data: {},
  };
}

/*
  Description : Login and sets JWT Token 
  Method : POST 
  data : { email , password }
*/

export async function login(data: any) {
  const { email, password } = data;

  const db = (await clientPromise).db("itrix");

  const users = db.collection("users");

  const isUserExist = await users.findOne({
    email,
  });

  if (!isUserExist) {
    return {
      success: false,
      message: "Account not found, Please Signup",
      data: {},
    };
  }

  const isSame = await comparePassword(password, isUserExist.password);

  if (isSame) {
    const jwtToken = await generateToken(
      {
        email: email,
        name: isUserExist.name,
      },
      "30d"
    );
    // create JWT Token

    return {
      success: true,
      message: "Login Success",
      data: {
        jwtToken,
      },
    };
  }

  return {
    success: false,
    message: "Incorrect Password",
    data: {},
  };
}

// need to do forgot password
export async function verifyResetPassword(data: any) {
  const { email, password, otp } = data;

  const db = (await clientPromise).db("itrix");

  const users = db.collection("users");

  const isUserExist = await users.findOne({
    email,
  });

  if (!isUserExist) {
    return {
      success: false,
      message: "Account not found, Please Signup",
      data: {},
    };
  }

  if (!isUserExist.isVerified) {
    return {
      success: false,
      message: "Account is not Verified yet",
      data: {},
    };
  }
  const validTime = new Date(isUserExist.validTill).getTime();

  const currentTime = new Date().getTime();

  if (otp == -1 || isUserExist.otp != otp || currentTime > validTime) {
    return {
      success: false,
      message: "OTP is not valid",
      data: {},
    };
  }

  const hashedPassword = await hashPassword(password);

  await users.updateOne(
    {
      email,
    },
    {
      $set: {
        otp: -1,
        password: hashedPassword,
      },
    }
  );

  return {
    success: true,
    message: "Password has been reseted",
    data: {},
  };
}

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  "/api/googleAuth"
);
