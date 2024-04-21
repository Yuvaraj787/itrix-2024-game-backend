require("dotenv").config();
import express from "express";
import { Server, Socket } from "socket.io";
import http from "http";
import cors from "cors";
import AuctionRoom from "./Auction";
import AuthRoutes, { middleware } from "./routes/auth";
import { verifyToken } from "./utils";
import bodyParser from "body-parser";
import axios from "axios"
// import AuthRoutes from "./routes/auth"
import ScoreManagement from "./routes/scores_management"
import cookieParser from "cookie-parser"
import mongoose from "mongoose";
import { Mutex } from "async-mutex";
import { GoogleGenerativeAI } from "@google/generative-ai";

import conn from "./mongodb"

const app = express();
const port = 3000;
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use("/auth", AuthRoutes);
app.use("/scores", ScoreManagement);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);


async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});

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
    }
    var len = Object.keys(formObj).length
    var users = Object.keys(formObj)
    var formated = JSON.stringify(formObj)
    var missing = {
    
    }

    for (let i = 0; i < len; i++) {
      missing[users[i]] = {
        batting_score: -1,
        bowling_score: -1,
        overall_score: -1,
        players: formObj[users[i]].map(e => e.player_name),
        justification: "-"
      }
    }

    missing = JSON.stringify(missing)
    console.log(missing)
    const prompt = missing + ". These data contains information of various users and their respective cricket team players. now fill the batting_score, bowling_score, overall_score, rank and justification based on their balance of the team (consider the batting, bowling, captain and wicket-keeper and provide fair points (0-10) for each field and justification (reason for your points)).Strictly No other things required. just fill the required fields and just give the js stringified object (I parse your response with JSON.parse() so give response parse() doesnt throw any errors)"


    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    var obj = JSON.parse(text)
    console.log("Gemini provided results")
    const resObj = []
    for (let i = 0; i < len; i++) {
      let us = users[i];
      resObj.push({
        username: us,
        ...obj[us]
      })
}
resObj.sort((a,b) => b.overall_score - a.overall_score)
resObj.forEach((e,i) => e.rank = i + 1)
console.log(resObj)
return obj
} catch(Err) {
  console.log("Errors occured : " + Err.message)
  return {}
}
}

// run()

// this is Protected Route
app.get("/profile", middleware, (req: any, res: any) => {
  res.json({
    name: "yuva",
    age: 19,
  });
});

app.post("/roomExist", middleware, (req, res) => {
  console.log("received", req.query)
  res.json({
    exist: checkIfRoomExist(req.query.room_id)
  })
})

app.get("/suggestRooms", middleware, (req, res) => {
  console.log("suggest rooms request received")
  let active_rooms = rooms.filter(rm => rm.status == "Not Started")
  res.json(active_rooms);
})

const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: ["http://localhost:5173", "https://amritb.github.io"],
    methods: ["GET", "POST"],
  },
});

var rooms = [];

function checkIfRoomExist(room_id) {
  var fil =  rooms.filter(rm => rm.roomid == room_id)
  if (fil.length > 0) return true
  return false
}

function addRooms(room_id) {
  var duplicate = false;
  if (!checkIfRoomExist(room_id)) {
    rooms.push({ roomid: room_id, members: [] });
  }
}

function deleteRoom(room_id) {
  rooms = rooms.filter(rm => rm.roomid != room_id)
}

function checkifUserAlreadyJoined(roomid, username) {
  var exist = false;
  rooms.forEach((room) => {
    if (room.roomid == roomid) {
      room.members.forEach((member) => {
        if (member == username) exist = true;
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
      roomid,members:[username], status: "Not Started", roomObj: null, host: username
    })
  }

  console.log(rooms);
}

function markRoomStarted(roomid) {
  rooms.forEach(room => {
    if (room.roomid == roomid) {
      room.status = "Started"
    }
  })
}

function mapRoomObj(roomid, roomObj) {
  rooms.forEach(room => {
    if (room.roomid == roomid) {
      room.roomObj = roomObj
    }
  })
}

function getRoombj(roomid) {
  let n = rooms.length;
  for (let i = 0; i < n; i++) {
    if (rooms[i].roomid == roomid) {
      return rooms[i].roomObj
    }
  }
  return null;
}

function isRoomHasStarted(roomid) {
  let started = false
  rooms.forEach(room => {
    if (room.roomid == roomid) {
      started =  room.status == "Started"
    }
  })
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
  })
}

function deleteEmptyRooms() {
  rooms = rooms.filter(rm => rm.members.length > 0)
  console.log("Empty rooms deleted")
  console.log(rooms)
}

function isUserHost(roomid, username) {
  let room = rooms.find(e => e.roomid == roomid)
  console.log("user host status : ", room.host == username)
  return room.host == username
}

function isRoomEmpty(roomid) {
  let room = rooms.find(e => e.roomid == roomid)
  console.log("room length : ", room.members.length)
  return room.members.length == 0;
}

function isUserPresent(roomid, user) {
  let room = rooms.find(e => e.roomid == roomid)
  return room.members.includes(user)
}

function getHostName(roomid) {
  let room =  rooms.find(e => e.roomid == roomid)
  return room.host;
}

function changeHost(roomid, host) {
  rooms.forEach(room => {
    if (room.roomid == roomid) {
      room.host = host
    }
  })
}


io.on("connection", async (socket) => {
  var token = socket.handshake.query.token;

  var userObj = await verifyToken(token);
  var userName = userObj.name
  console.log(userName)

  var roomid = socket.handshake.query.room_id || "default_room";

    console.log("User connected : ", userName , " request to join ", roomid)

    if (checkifUserAlreadyJoined(roomid, userName)) {
      if (isRoomHasStarted(roomid)) {
          console.log("It seems user disconnected after the auction started. Trying to reconnect him....")
          let roomObj = getRoombj(roomid)
          socket.join(roomid)
          if (roomObj.reconnect(userName, token, socket)) {
            console.log("reconnection success")
            socket.emit("auction-started", () => console.log("Received by user"))
          } else {
            console.log("reconnection failed")
            return;
          }
      }
      return;
    } else {
      addMemberToGroup(roomid,userName)
    }

    if (isRoomHasStarted(roomid)) {
      console.log("Room already started so denied to join. sorry about that")
      socket.emit("already-started","too late to join")
      return;
    }

    socket.on("who-is-host", (callBack)=>{
      callBack(getHostName(roomid))
    })

    socket.on("disconnect", async () => {
      if (isRoomHasStarted(roomid)) {
          console.log("Client disconnected after auction started")
          let roomObj = getRoombj(roomid)
          roomObj.markUserHasDisconnected(userName)
      } else {
          console.log("Client disconnected before auction started");
          removeUserfromRoom(roomid, userName)
          console.log(rooms)
        if (isUserHost(roomid, userName) && !isRoomEmpty(roomid)) {
            console.log("host is disconnected")
            let allSockets = await io.in(roomid).fetchSockets();
            setTimeout(async ()=>{
              if (!isUserPresent(roomid, userName)) {
                let u_obj = await verifyToken(allSockets[0].handshake.query.token);
                let u_name = u_obj.name
                changeHost(roomid, u_name)
                allSockets[0].emit("accept-host", u_name);
                console.log(rooms.find(e => e.roomid == roomid))
              }
            }, 1000)
          }
          io.to(roomid).emit("users_added", getUsers(roomid))

      }
      deleteEmptyRooms()
    })

    socket.join(roomid)

    io.to(roomid).emit("users_added", getUsers(roomid))

    socket.on("start-auction",async (msg) => {
      
      markRoomStarted(roomid)

      console.log("auction started")
      var allSockets = await io.in(roomid).fetchSockets()
      var auction_room = new AuctionRoom(io, socket, roomid, getUsers(roomid), allSockets);
      mapRoomObj(roomid, auction_room)
      var mutex = new Mutex()

      var tid = setInterval(() => {
          let count = 1;  
          socket.to(roomid).emit("auction-started", async () => {
             count++;
            allSockets = await io.in(roomid).fetchSockets()
            if (count == allSockets.length) {
                await mutex.acquire()
                console.log("Got response from all started the auction now")
                clearTimeout(tid)
                auction_room.start()
            }
          })
      }, 2000)
    })

})
export {deleteRoom}
server.listen(port, () => console.log("Server is listening at PORT :", port));
