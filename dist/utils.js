"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.verifyToken = exports.sendMail = exports.comparePassword = exports.hashPassword = exports.rateLimiting = exports.googleRecaptcha = void 0;
const nodemailer_1 = require("nodemailer");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = require("jsonwebtoken");
const axios_1 = __importDefault(require("axios"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const transport = (0, nodemailer_1.createTransport)({
    host: process.env.SMTP_SERVER,
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.PASSWD,
    },
});
const googleRecaptcha = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
    const resp = yield axios_1.default.get(googleRecaptchaUrl);
    if (resp.data["success"]) {
        next();
    }
    else {
        console.log(resp.data);
        return res.status(401).json({
            success: false,
            message: "Google recaptcha Failed",
            data: {},
        });
    }
});
exports.googleRecaptcha = googleRecaptcha;
// this function blacklist malicious brute force request
exports.rateLimiting = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
    max: 200,
    message: '{"message":"Exceeded Request Limit" , "success":false,"data":{}}',
    headers: true,
});
const convertToIndianTime = (timeNow) => {
    const currentOffset = timeNow.getTimezoneOffset();
    const ISTOffset = 330; // IST offset UTC +5:30
    var ISTTime = new Date(timeNow.getTime() + (ISTOffset + currentOffset) * 60000).toLocaleTimeString();
    return ISTTime;
};
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = yield bcrypt_1.default.hash(password, 10);
    return hash;
});
exports.hashPassword = hashPassword;
const comparePassword = (password, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const isSame = yield bcrypt_1.default.compare(password, hashedPassword);
    return isSame;
});
exports.comparePassword = comparePassword;
const sendMail = (subject, email, otp, validTill, createdAt, message) => __awaiter(void 0, void 0, void 0, function* () {
    let result = false;
    yield transport.sendMail({
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
    }, (error, info) => {
        if (error) {
            console.log("Error: ", error, "mail", email);
            result = false;
        }
        else if (info.accepted) {
            result = true;
        }
        else
            result = false;
    });
    return result;
});
exports.sendMail = sendMail;
function verifyToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                let load = (0, jsonwebtoken_1.verify)(token, "key123");
                //@ts-ignore
                if (load != undefined &&
                    //@ts-ignore
                    load.email != undefined &&
                    //@ts-ignore
                    load.email != null &&
                    //@ts-ignore
                    load.email != "") {
                    //@ts-ignore
                    return resolve(load);
                }
                return reject(null);
            }
            catch (e) {
                console.log(e);
                //@ts-ignore
                return reject(null);
            }
        });
    });
}
exports.verifyToken = verifyToken;
const generateToken = (data, expiresIn) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, jsonwebtoken_1.sign)(data, "key123", {
        expiresIn: expiresIn,
    });
});
exports.generateToken = generateToken;
//# sourceMappingURL=utils.js.map