import { createTransport } from "nodemailer";
import { sign, verify } from "jsonwebtoken";
import { google } from "googleapis";
import clientPromise from "./mongodb";
import { sendMail } from "./utils";

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
   user Schema : 
   name,
   email,
   isVerified ,
   isCegian ,
   otp ,
   validTill ,
   bought_passes 
*/
// create new User

export async function signUp(data: any) {
  const { name, email, isCegian } = data;

  // need to do validity checks

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

  const otp = Math.floor(100000 + Math.random() * 900000);

  // send mail
  const timeNow = new Date();

  timeNow.setSeconds(timeNow.getSeconds() + 120);

  await sendMail(
    "Auction Game - OTP",
    email,
    otp,
    timeNow, new Date() 
  );

  await users.insertOne({
    name,
    email,
    isCegian,
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

// verify Otp
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

  console.log(otp, Number(isUserExist.otp));

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

// resend otp

export async function resendOtp(data: any) {
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

  if (user.isVerified) {
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

  await sendMail("Auction Game - New OTP", email, otp, timeNow, new Date());

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
    message: "Check Mail Again",
    data: {},
  };
}

export async function generateEmailToken(emailId: string) {
  return generateToken(emailId, "10m");
}

export async function generateCookieToken(emailId: string) {
  return generateToken(emailId, "30d");
}

export async function generateToken(emailId: string, expiresIn: string) {
  return sign(
    {
      email: emailId,
    },
    process.env.SECRET_KEY || "key123",
    { expiresIn: expiresIn }
  );
}

export async function verifyToken(token: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    try {
      let load = verify(token, process.env.SECRET_KEY || "key123");
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
        return resolve(load.email || "");
      }
      return reject(null);
    } catch (e) {
      console.log(e);
      //@ts-ignore
      return reject(null);
    }
  });
}

export async function verifyEmailTokenInServer(
  token: string
): Promise<{ msg: string; error?: string }> {
  try {
    const email = await verifyToken(token);
    if (email == null) {
      return { msg: "Email is not verified" };
    }

    const cookieToken = await generateCookieToken(email);

    const db = (await clientPromise).db("itrix");
    const collectionExists = await db
      .listCollections({ name: "users" })
      .hasNext();

    const users = db.collection("users");

    await users.updateOne(
      { email: email },
      { $set: { email: email } },
      { upsert: true }
    );

    const doc = await users.findOne({ email: email });
    if (doc?.verified == undefined) {
      await users.updateOne(
        { email: email },
        { $set: { verified: true, bought_passes: [], cegian: false } },
        { upsert: true }
      );
    }

    return { msg: cookieToken };
  } catch (e: any) {
    console.log("Error in verifying email token " + e.message);
    return { msg: "", error: "Token Error" };
  }
}

export async function sendVerificationLink(email: string): Promise<string> {
  const token = await generateEmailToken(email);
  console.log(token);
  return new Promise((resolve, reject) => {
    transport.sendMail(
      {
        from: "admin@istaceg.in",
        to: email,
        subject: "Email Alert",
        html: `
          <div>
          
          <p>Click this Link to verify login to this account 
          <a href="http://${process.env.CURRENT_SERVER_IP}/auth/verify?token=${token}" target="_blank">
            http://${process.env.CURRENT_SERVER_IP}/auth/verify?token=${token}
          </a> 
          to verify your account</p>
          
          </div>
        `,
      },
      (error, info) => {
        console.log("Error hi ", error);
        if (error != null) {
          return reject(error?.message);
        }
        console.log(error, info);
        console.log("I am happening");
        if (info.accepted) return resolve("");
        else return resolve(info.response);
      }
    );
  });
}

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  "/api/googleAuth"
);