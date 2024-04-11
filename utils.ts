import { createTransport } from "nodemailer";

const convertToIndianTime = (timeNow) => {
  const currentOffset = timeNow.getTimezoneOffset();

  const ISTOffset = 330; // IST offset UTC +5:30

  var ISTTime = new Date(
    timeNow.getTime() + (ISTOffset + currentOffset) * 60000
  ).toLocaleTimeString();

  return ISTTime;
};

const transport = createTransport({
  host: process.env.SMTP_SERVER,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.PASSWD,
  },
});

export const sendMail = async (
  subject: any,
  email: any,
  otp: any,
  validTill: any,
  createdAt: any
) => {
  await transport.sendMail(
    {
      from: "admin@istaceg.in",
      to: email,
      subject: subject,
      html: `
            <div>
            
            <p> Otp is valid for 120 seconds </p>

            <p> Created at : ${convertToIndianTime(createdAt)} </p>

            <p> Valid Till : ${convertToIndianTime(validTill)} </p> 
            
            <h2> OTP : ${otp} </h2>
            
            </div>
          `,
    },
    (error, info) => {
      if (error) {
        console.log("Error: ", error, "mail", email);
        return false;
      }

      if (info.accepted) return true;
      return false;
    }
  );
};
