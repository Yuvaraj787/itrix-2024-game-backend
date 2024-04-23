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
exports.verifyResetPassword = exports.login = exports.resendOtp = exports.verifyOtp = exports.signUp = void 0;
const nodemailer_1 = require("nodemailer");
const googleapis_1 = require("googleapis");
const mongodb_1 = __importDefault(require("./mongodb"));
const utils_1 = require("./utils");
const transport = (0, nodemailer_1.createTransport)({
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
function signUp(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, email, password } = data;
        const db = (yield mongodb_1.default).db("itrix");
        const users = db.collection("users");
        const isUserExist = yield users.findOne({
            email,
        });
        if (isUserExist) {
            return {
                success: false,
                message: "User Already exists",
                data: {},
            };
        }
        const hashedPassword = yield (0, utils_1.hashPassword)(password);
        const otp = Math.floor(100000 + Math.random() * 900000);
        // send mail
        const timeNow = new Date();
        timeNow.setSeconds(timeNow.getSeconds() + 120);
        yield (0, utils_1.sendMail)("Auction Game - OTP", email, otp, timeNow, new Date(), "");
        yield users.insertOne({
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
    });
}
exports.signUp = signUp;
/*
  Description : verify OTP
  Method : POST
  data : {email , otp }
*/
function verifyOtp(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, otp } = data;
        const db = (yield mongodb_1.default).db("itrix");
        const users = db.collection("users");
        const isUserExist = yield users.findOne({
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
                yield users.updateOne({
                    email,
                }, {
                    $set: {
                        otp: -1,
                        isVerified: true,
                    },
                });
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
    });
}
exports.verifyOtp = verifyOtp;
/*
  Description : Resending OTP
  Method : POST
  data : { email }
*/
function resendOtp(data, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const email = data.email;
        const db = (yield mongodb_1.default).db("itrix");
        const users = db.collection("users");
        const user = yield users.findOne({
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
        yield (0, utils_1.sendMail)("Auction Game - New OTP", email, otp, timeNow, new Date(), message);
        yield users.updateOne({
            email,
        }, {
            $set: { otp, validTill: timeNow },
        });
        return {
            success: true,
            message: "Check Mail",
            data: {},
        };
    });
}
exports.resendOtp = resendOtp;
/*
  Description : Login and sets JWT Token
  Method : POST
  data : { email , password }
*/
function login(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = data;
        const db = (yield mongodb_1.default).db("itrix");
        const users = db.collection("users");
        const isUserExist = yield users.findOne({
            email,
        });
        if (!isUserExist) {
            return {
                success: false,
                message: "Account not found, Please Signup",
                data: {},
            };
        }
        if (isUserExist.isVerified === false) {
            return {
                success: false,
                message: "Account not Verified, Visit Signup Page",
                data: {},
            };
        }
        const isSame = yield (0, utils_1.comparePassword)(password, isUserExist.password);
        if (isSame) {
            const jwtToken = yield (0, utils_1.generateToken)({
                email: email,
                name: isUserExist.name,
            }, "30d");
            // create JWT Token
            return {
                success: true,
                message: "Login Success",
                data: {
                    jwtToken,
                    userName: isUserExist.name
                },
            };
        }
        return {
            success: false,
            message: "Incorrect Password",
            data: {},
        };
    });
}
exports.login = login;
// need to do forgot password
function verifyResetPassword(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password, otp } = data;
        const db = (yield mongodb_1.default).db("itrix");
        const users = db.collection("users");
        const isUserExist = yield users.findOne({
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
        const hashedPassword = yield (0, utils_1.hashPassword)(password);
        yield users.updateOne({
            email,
        }, {
            $set: {
                otp: -1,
                password: hashedPassword,
            },
        });
        return {
            success: true,
            message: "Password has been reseted",
            data: {},
        };
    });
}
exports.verifyResetPassword = verifyResetPassword;
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID, process.env.OAUTH_CLIENT_SECRET, "/api/googleAuth");
//# sourceMappingURL=action.js.map