"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.deleteRoom = void 0;
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const Auction_1 = __importDefault(require("./Auction"));
const auth_1 = __importStar(require("./routes/auth"));
const utils_1 = require("./utils");
const body_parser_1 = __importDefault(require("body-parser"));
// import AuthRoutes from "./routes/auth"
const scores_management_1 = __importDefault(require("./routes/scores_management"));
const async_mutex_1 = require("async-mutex");
const generative_ai_1 = require("@google/generative-ai");
const app = (0, express_1.default)();
const port = 3000;
const server = http_1.default.createServer(app);
app.use(express_1.default.static('public'));
app.use((0, cors_1.default)());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use("/auth", auth_1.default);
app.use("/scores", scores_management_1.default);
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_KEY);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            var formObj = {
                yuvarajv: [
                    { player_name: 'Marnus Labuschagne' },
                    { player_name: 'Ambati Rayudu' },
                    { player_name: 'Aaron Finch' },
                    { player_name: 'Adam Zampa' },
                    { player_name: 'Nathan Coulter-Nile' }
                ],
                Raju: [
                    { player_name: 'Babar Azam' },
                    { player_name: 'Reeza Hendricks' },
                    { player_name: 'Chris Lynn' },
                    { player_name: 'Shehan Jayasuriya' },
                    { player_name: 'Kane Williamson' }
                ]
            };
            var len = Object.keys(formObj).length;
            var users = Object.keys(formObj);
            var formated = JSON.stringify(formObj);
            var missing = {};
            for (let i = 0; i < len; i++) {
                missing[users[i]] = {
                    batting_score: -1,
                    bowling_score: -1,
                    overall_score: -1,
                    players: formObj[users[i]].map(e => e.player_name),
                    justification: "-"
                };
            }
            missing = JSON.stringify(missing);
            console.log(missing);
            const prompt = missing + ". These data contains information of various users and their respective cricket team players. now fill the batting_score, bowling_score, overall_score, rank and justification based on their balance of the team (consider the batting, bowling, captain and wicket-keeper and provide fair points (0-10) for each field and justification (reason for your points)).Strictly No other things required. just fill the required fields and just give the js stringified object (I parse your response with JSON.parse() so give response parse() doesnt throw any errors)";
            const result = yield model.generateContent(prompt);
            const response = yield result.response;
            const text = response.text();
            var obj = JSON.parse(text);
            console.log("Gemini provided results");
            const resObj = [];
            for (let i = 0; i < len; i++) {
                let us = users[i];
                resObj.push(Object.assign({ username: us }, obj[us]));
            }
            resObj.sort((a, b) => b.overall_score - a.overall_score);
            resObj.forEach((e, i) => e.rank = i + 1);
            console.log(resObj);
            return obj;
        }
        catch (Err) {
            console.log("Errors occured : " + Err.message);
            return {};
        }
    });
}
// run()
// this is Protected Route
app.get("/profile", auth_1.middleware, (req, res) => {
    res.json({
        name: "yuva",
        age: 19,
    });
});
app.post("/roomExist", auth_1.middleware, (req, res) => {
    console.log("received", req.query);
    res.json({
        exist: checkIfRoomExist(req.query.room_id)
    });
});
app.get("/suggestRooms", auth_1.middleware, (req, res) => {
    console.log("suggest rooms request received");
    let active_rooms = rooms.filter(rm => rm.status == "Not Started");
    res.json(active_rooms);
});
const io = new socket_io_1.Server(server, {
    connectionStateRecovery: {},
    cors: {
        origin: ["http://localhost:5173", "https://amritb.github.io"],
        methods: ["GET", "POST"],
    },
});
var rooms = [];
function checkIfRoomExist(room_id) {
    var fil = rooms.filter(rm => rm.roomid == room_id);
    if (fil.length > 0)
        return true;
    return false;
}
function addRooms(room_id) {
    var duplicate = false;
    if (!checkIfRoomExist(room_id)) {
        rooms.push({ roomid: room_id, members: [] });
    }
}
function deleteRoom(room_id) {
    rooms = rooms.filter(rm => rm.roomid != room_id);
}
exports.deleteRoom = deleteRoom;
function checkifUserAlreadyJoined(roomid, username) {
    var exist = false;
    rooms.forEach((room) => {
        if (room.roomid == roomid) {
            room.members.forEach((member) => {
                if (member == username)
                    exist = true;
            });
        }
    });
    return exist;
}
function addMemberToGroup(roomid, username) {
    var found = false;
    rooms.forEach((room) => {
        if (room.roomid == roomid) {
            found = true;
            room.members.push(username);
        }
    });
    if (!found) {
        rooms.push({
            roomid, members: [username], status: "Not Started", roomObj: null, host: username
        });
    }
    console.log(rooms);
}
function markRoomStarted(roomid) {
    rooms.forEach(room => {
        if (room.roomid == roomid) {
            room.status = "Started";
        }
    });
}
function mapRoomObj(roomid, roomObj) {
    rooms.forEach(room => {
        if (room.roomid == roomid) {
            room.roomObj = roomObj;
        }
    });
}
function getRoombj(roomid) {
    let n = rooms.length;
    for (let i = 0; i < n; i++) {
        if (rooms[i].roomid == roomid) {
            return rooms[i].roomObj;
        }
    }
    return null;
}
function isRoomHasStarted(roomid) {
    let started = false;
    rooms.forEach(room => {
        if (room.roomid == roomid) {
            started = room.status == "Started";
        }
    });
    return started;
}
function getUsers(roomid) {
    var needed_room = rooms.find((room) => room.roomid == roomid);
    return needed_room;
}
function removeUserfromRoom(roomid, username) {
    rooms.forEach(room => {
        if (room.roomid == roomid) {
            room.members = room.members.filter(usr => usr != username);
        }
    });
}
function deleteEmptyRooms() {
    rooms = rooms.filter(rm => rm.members.length > 0);
    console.log("Empty rooms deleted");
    console.log(rooms);
}
function isUserHost(roomid, username) {
    let room = rooms.find(e => e.roomid == roomid);
    console.log("user host status : ", room.host == username);
    return room.host == username;
}
function isRoomEmpty(roomid) {
    let room = rooms.find(e => e.roomid == roomid);
    console.log("room length : ", room.members.length);
    return room.members.length == 0;
}
function isUserPresent(roomid, user) {
    let room = rooms.find(e => e.roomid == roomid);
    return room.members.includes(user);
}
function getHostName(roomid) {
    let room = rooms.find(e => e.roomid == roomid);
    return room.host;
}
function changeHost(roomid, host) {
    rooms.forEach(room => {
        if (room.roomid == roomid) {
            room.host = host;
        }
    });
}
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    var token = socket.handshake.query.token;
    var userObj = yield (0, utils_1.verifyToken)(token);
    var userName = userObj.name;
    console.log(userName);
    var roomid = socket.handshake.query.room_id || "default_room";
    console.log("User connected : ", userName, " request to join ", roomid);
    if (checkifUserAlreadyJoined(roomid, userName)) {
        if (isRoomHasStarted(roomid)) {
            console.log("It seems user disconnected after the auction started. Trying to reconnect him....");
            let roomObj = getRoombj(roomid);
            socket.join(roomid);
            if (roomObj.reconnect(userName, token, socket)) {
                console.log("reconnection success");
                socket.emit("auction-started", () => console.log("Received by user"));
            }
            else {
                console.log("reconnection failed");
                return;
            }
        }
        return;
    }
    else {
        addMemberToGroup(roomid, userName);
    }
    if (isRoomHasStarted(roomid)) {
        console.log("Room already started so denied to join. sorry about that");
        socket.emit("already-started", "too late to join");
        return;
    }
    socket.on("who-is-host", (callBack) => {
        callBack(getHostName(roomid));
    });
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        if (isRoomHasStarted(roomid)) {
            console.log("Client disconnected after auction started");
            let roomObj = getRoombj(roomid);
            roomObj.markUserHasDisconnected(userName);
        }
        else {
            console.log("Client disconnected before auction started");
            removeUserfromRoom(roomid, userName);
            console.log(rooms);
            if (isUserHost(roomid, userName) && !isRoomEmpty(roomid)) {
                console.log("host is disconnected");
                let allSockets = yield io.in(roomid).fetchSockets();
                setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    if (!isUserPresent(roomid, userName)) {
                        let u_obj = yield (0, utils_1.verifyToken)(allSockets[0].handshake.query.token);
                        let u_name = u_obj.name;
                        changeHost(roomid, u_name);
                        allSockets[0].emit("accept-host", u_name);
                        console.log(rooms.find(e => e.roomid == roomid));
                    }
                }), 1000);
            }
            io.to(roomid).emit("users_added", getUsers(roomid));
        }
        deleteEmptyRooms();
    }));
    socket.join(roomid);
    io.to(roomid).emit("users_added", getUsers(roomid));
    socket.on("start-auction", (msg) => __awaiter(void 0, void 0, void 0, function* () {
        markRoomStarted(roomid);
        console.log("auction started");
        var allSockets = yield io.in(roomid).fetchSockets();
        var auction_room = new Auction_1.default(io, socket, roomid, getUsers(roomid), allSockets);
        mapRoomObj(roomid, auction_room);
        var mutex = new async_mutex_1.Mutex();
        var tid = setInterval(() => {
            let count = 1;
            socket.to(roomid).emit("auction-started", () => __awaiter(void 0, void 0, void 0, function* () {
                count++;
                allSockets = yield io.in(roomid).fetchSockets();
                if (count == allSockets.length) {
                    yield mutex.acquire();
                    console.log("Got response from all started the auction now");
                    clearTimeout(tid);
                    auction_room.start();
                }
            }));
        }, 2000);
    }));
}));
server.listen(port, () => console.log("Server is listening at PORT :", port));
//# sourceMappingURL=index.js.map