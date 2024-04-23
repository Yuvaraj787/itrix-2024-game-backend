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
Object.defineProperty(exports, "__esModule", { value: true });
exports.middleware = void 0;
const express_1 = require("express");
const action_1 = require("../action");
const utils_1 = require("../utils");
const validators_1 = require("../validators");
const router = (0, express_1.Router)();
router.use((req, res, next) => {
    if (req.path === "/verifyToken") {
        next();
    }
    else {
        res.setHeader("Content-type", "application/json");
        return (0, utils_1.rateLimiting)(req, res, next);
    }
});
router.post("/login", validators_1.loginValidator, 
// googleRecaptcha,
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("received");
    try {
        const data = yield (0, action_1.login)(req.body);
        console.log(data);
        res.json(data);
    }
    catch (err) {
        console.log("ERROR: " + err.message);
        res.json({ success: false, message: "Error", data: {} });
    }
}));
router.post("/signup", utils_1.googleRecaptcha, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, action_1.signUp)(req.body);
        res.json(data);
    }
    catch (err) {
        console.log("ERROR: " + err.message);
        res.json({ success: false, message: "Error", data: {} });
    }
}));
router.post("/verifyOtp", utils_1.googleRecaptcha, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("request came", req.query);
        const data = yield (0, action_1.verifyOtp)(req.body);
        res.json(data);
    }
    catch (err) {
        console.log("ERROR: " + err.message);
        res.json({ success: false, message: "Error", data: {} });
    }
}));
router.post("/resendOtp", utils_1.googleRecaptcha, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("request came", req.query);
        const data = yield (0, action_1.resendOtp)(req.body, "Resending OTP");
        res.json(data);
    }
    catch (err) {
        console.log("ERROR: " + err.message);
        res.json({ success: false, message: "Error", data: {} });
    }
}));
const middleware = (req, res, next) => {
    try {
        const token = req.headers["authorization"];
        console.log("Middle ware triggered ", token);
        if (typeof token !== "undefined") {
            const jwt = token.split(" ")[1];
            (0, utils_1.verifyToken)(jwt)
                .then((msg) => {
                // decoded jwt token will be stored here !! 
                req.data = msg;
                next();
            })
                .catch((err) => {
                console.log("error in token verification");
                res
                    .status(498)
                    .json({ success: false, message: "Invalid/Expired JWT", data: {} });
            });
        }
        else {
            res
                .status(498)
                .json({ success: false, message: "Token Not Found", data: {} });
        }
    }
    catch (err) {
        res.json({ success: false });
    }
};
exports.middleware = middleware;
router.post("/resetPasswordOtp", utils_1.googleRecaptcha, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, action_1.resendOtp)(req.body, "OTP for Reseting password");
        res.json(data);
    }
    catch (err) {
        console.log("ERROR: " + err.message);
        res.json({ success: false, message: "Operation failed", data: {} });
    }
}));
router.post("/verifyResetPassword", utils_1.googleRecaptcha, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, action_1.verifyResetPassword)(req.body);
        res.json(data);
    }
    catch (err) {
        console.log("ERROR: " + err.message);
        res.json({ success: false, message: "Operation failed", data: {} });
    }
}));
router.get("/verifyToken", exports.middleware, (req, res) => {
    res.json({ success: true, message: "JWT Verified", data: req.data });
});
exports.default = router;
//# sourceMappingURL=auth.js.map