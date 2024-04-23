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
const playersData_json_1 = __importDefault(require("./playersData.json"));
const countries_json_1 = __importDefault(require("./countries.json"));
const generative_ai_1 = require("@google/generative-ai");
const utils_1 = require("./utils");
const scores_management_1 = require("./routes/scores_management");
const index_1 = require("./index");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_KEY);
function run(gameData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            var n = gameData.length;
            var formObj = {};
            for (var i = 0; i < n; i++) {
                if (formObj[gameData[i].username]) {
                    formObj[gameData[i].username].push({
                        player_name: gameData[i].player.fullname
                    });
                }
                else {
                    formObj[gameData[i].username] = [];
                    i--;
                }
            }
            var len = Object.keys(formObj).length;
            var users = Object.keys(formObj);
            var missing = {};
            for (let i = 0; i < len; i++) {
                missing[users[i]] = {
                    batting_score: -1,
                    bowling_score: -1,
                    overall_score: -1,
                    players: formObj[users[i]].map(e => e.player_name),
                    justication: "-"
                };
            }
            var missing_str = JSON.stringify(missing);
            console.log(missing_str);
            const prompt = missing_str + ". These data contains information of various users and their respective cricket team players. now fill the batting_score (0 - 10), bowling_score(0 - 10), overall_score(0 - 10), rank and justification based on their balance of the team (consider the batting, bowling, captain and wicket-keeper and provide fair points for each field and justification (reason for your points)).Strictly No other things required. just fill the required fields and just give the js stringified object (I parse your response with JSON.parse() so give response parse() doesnt throw any errors)";
            const result = yield model.generateContent(prompt);
            const response = yield result.response;
            const text = response.text();
            var obj = JSON.parse(text);
            console.log("Gemini provided results");
            const resArr = [];
            for (let i = 0; i < len; i++) {
                let us = users[i];
                resArr.push(Object.assign(Object.assign({}, obj[us]), { username: us, players: missing[us].players }));
            }
            resArr.sort((a, b) => b.overall_score - a.overall_score);
            resArr.forEach((e, i) => e.rank = i + 1);
            console.log(resArr);
            return resArr;
        }
        catch (Err) {
            console.log("Errors occured : " + Err.message);
            return {};
        }
    });
}
function updateToDB(scores) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let formateArray = [];
            Object.keys(scores).map(un => {
                formateArray.push(Object.assign({ username: un }, scores[un]));
            });
            return yield (0, scores_management_1.updateUserPoints)(formateArray);
        }
        catch (err) {
            console.log("ERROR in updating scores to db : " + err.message);
        }
    });
}
function idToCountryName(id) {
    var arr = countries_json_1.default["data"];
    var len = arr.length;
    for (var i = 0; i < len; i++) {
        if (arr[i].id == id) {
            return { countryName: arr[i].name, flagUrl: arr[i].image_path };
        }
    }
    console.log("Country Not found");
}
class AuctionRoom {
    constructor(io, socket, roomid, users, allSockets) {
        this.AvailablePlayers = playersData_json_1.default["data"].slice(0, 120);
        this.io = io;
        this.roomid = roomid;
        this.socket = socket;
        this.biddingTime = 7;
        this.waitingTime = 2;
        this.counter = this.biddingTime;
        this.users = {};
        console.log(users);
        users.members.forEach(user => {
            this.users[user] = { amountLeft: 100, slotsLeft: 5, disconnected: false };
        });
        this.last_bid = {
            user_name: "none",
            player: {
                id: -1
            }
        };
        this.allSockets = allSockets;
        this.sold_players = [];
        this.unsold_players = [];
        this.AvailablePlayers.forEach(player => {
            player["basePrice"] = 5;
            player["currentPrice"] = 0;
            var countryInfo = idToCountryName(player.country_id);
            player["countryName"] = countryInfo.countryName;
            player["flagUrl"] = countryInfo.flagUrl;
        });
    }
    markUserHasDisconnected(username) {
        this.users[username].disconnected = true;
    }
    getRandomPlayer() {
        var no = Math.floor(Math.random() * this.AvailablePlayers.length);
        return this.AvailablePlayers.splice(no, 1)[0];
    }
    isGameOver() {
        var gameOff = true;
        Object.keys(this.users).forEach(user => {
            // if (!this.users[user].disconnected)
            if (!this.users[user].disconnected && this.users[user].slotsLeft > 0) {
                if (this.users[user].amountLeft >= 5) {
                    gameOff = false;
                }
            }
        });
        if (gameOff) {
            console.log("The game is over");
        }
        return gameOff;
    }
    manageTimeOut(player) {
        var str = "bid" + player.id;
        return new Promise(resolve => this.timerId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (this.counter == 0) {
                if (this.typeOfTimer == "bidding timer") {
                    this.io.off(str, () => { });
                    if (this.last_bid.player.currentPrice == 0) {
                        this.io.to(this.roomid).emit("unsold", this.last_bid);
                    }
                    else {
                        this.sold_players.push(this.last_bid);
                        this.users[this.last_bid.username].amountLeft -= this.last_bid.player.currentPrice;
                        this.users[this.last_bid.username].slotsLeft--;
                        this.io.to(this.roomid).emit("sold", [this.last_bid, this.sold_players, this.users]);
                    }
                    // setTimeout(() => {}, 1000)
                    this.typeOfTimer = "waiting timer";
                    this.counter = this.waitingTime;
                    this.io.to(this.roomid).emit("timeout", "Times out for bidding");
                    return;
                }
                this.typeOfTimer = "bidding timer";
                this.counter = this.biddingTime;
                clearTimeout(this.timerId);
                if (this.isGameOver()) {
                    (0, index_1.deleteRoom)(this.roomid);
                    console.log(this.sold_players);
                    this.io.to(this.roomid).emit("game-over", "game-over");
                    var scoresData = yield run(this.sold_players);
                    this.io.to(this.roomid).emit("scores", JSON.stringify(scoresData));
                    var format = scoresData.map(e => { return { username: e.username, score: e.overall_score }; });
                    var result = (0, scores_management_1.updateUserPoints)(format);
                    if ((yield result).success) {
                        console.log("points updated successfully");
                    }
                    else {
                        console.log("Error in updating points to db : ", result.error);
                    }
                }
                else {
                    var player = this.getRandomPlayer();
                    this.last_bid = {
                        username: "none", player
                    };
                    this.bidThisPlayer(player);
                }
            }
            else {
                if (this.typeOfTimer == "bidding timer") {
                    this.io.to(this.roomid).emit("counter", this.counter);
                }
                else {
                    this.io.to(this.roomid).emit("waiting counter", this.counter);
                }
                this.counter--;
            }
        }), 1000));
    }
    reconnect(username, token, skt) {
        this.users[username].disconnected = false;
        let n = this.allSockets.length;
        for (let i = 0; i < n; i++) {
            if (this.allSockets[i].handshake.query.token == token) {
                this.allSockets[i] = skt;
                return true;
            }
        }
        return false;
    }
    bidThisPlayer(player) {
        return __awaiter(this, void 0, void 0, function* () {
            this.io.to(this.roomid).emit("start-bidding", [player, this.users]);
            let users = [];
            this.allSockets.forEach(eachSk => {
                eachSk.on("bid" + player.id, (msg) => __awaiter(this, void 0, void 0, function* () {
                    const verifiedName = (0, utils_1.verifyToken)(msg.token);
                    if (msg.username != verifiedName) {
                        console.log("something wrong");
                    }
                    if (msg.player.currentPrice <= this.last_bid.player.currentPrice || this.users[msg.username].slotsLeft == 0) {
                        console.log("Not a valid bid");
                        return;
                    }
                    if (this.users[msg.username].amountLeft < msg.player.currentPrice) {
                        console.log("Not a valid bid");
                        return;
                    }
                    this.last_bid = msg;
                    console.log(`client ${msg.username} bidded for ${player.fullname}`);
                    this.io.to(this.roomid).emit("inc-bid-amount", msg);
                    console.log(`Current price for the player ${msg.player.fullname} is ${msg.player.currentPrice}`);
                    this.typeOfTimer = "bidding timer";
                    this.counter = this.biddingTime;
                }));
                eachSk.on("skip" + player.id, (msg) => __awaiter(this, void 0, void 0, function* () {
                    if (!users.includes(msg)) {
                        users.push(msg);
                        this.io.to(this.roomid).emit("skip", users.length);
                    }
                    this.io.to(this.roomid).emit("skip", users);
                    if (users.length == this.allSockets.length) {
                        this.counter = 1;
                    }
                }));
            });
            yield this.manageTimeOut(player);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Auction is started");
            // var player = this.getRandomPlayer()
            // this.last_bid = {
            //     username : "none", player
            // }
            this.typeOfTimer = "waiting timer";
            this.counter = this.waitingTime;
            yield this.manageTimeOut({});
        });
    }
}
exports.default = AuctionRoom;
//# sourceMappingURL=Auction.js.map