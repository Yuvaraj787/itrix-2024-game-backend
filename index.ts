require("dotenv").config();
import express from "express";
import { Server, Socket } from "socket.io";
import http from 'http';
import cors from "cors";
import AuctionRoom from "./Auction";
import axios from "axios"
import AuthRoutes from "./routes/auth"
import cookieParser from "cookie-parser"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mutex } from "async-mutex";



const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  // var n = gameData.length;
  var formated = {}
  // for (var i = 0; i < n; i++) {
  //   if (formated[gameData[i].username]) {
  //     formated[gameData[i].username].push({
  //       player_name : gameData[i].player.fullname
  //     })
  //   } else {
  //     formated[gameData[i].username] = [];
  //     i--;
  //   }
  // }
  formated = {
    yuvaraj: [
      { player_name: 'Jasprit Bumrah' },
      { player_name: 'Travis Head' },
      { player_name: 'Ravichandran Ashwin' },
      { player_name: 'Virat Kohli' },
      { player_name: 'Rohit Sharma' }
    ],
    muthu: [
      { player_name: 'Trent Boult' },
      { player_name: 'David Warner' },
      { player_name: 'Ravindra Jadeja' },
      { player_name: 'Ruturaj Gaikwad' },
      { player_name: 'Tilak Varma' }
    ]
  }
  console.log(formated)
  formated = JSON.stringify(formated)
  const prompt = formated + ". Analyse these data which is collected during mock ipl auction and give the score (1-10) to the each user who picked best players and balanced team and rank them in ascending order. format them by username, batting_score, bowling_score, overall_score, rank (respect to overall score),justification for points and array of players name picked by the corressponding user  in js object. no other thing required just give only js object. consider batting, bowling, wicket-keeping and allrounder equally (Consider all  T20 stats of these players and give fair points). start with { end with }.strictly no other things  "
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  var k = JSON.parse(text)
  console.log(k)
}
// run()

// Access your API key as an environment variable (see "Set up your API key" above)


const app = express()
const port = 3000
const server = http.createServer(app);

// app.use("/auth", AuthRoutes)
app.use(cors())
app.use(cookieParser())

const io = new Server(server, {
    connectionStateRecovery: {},
    cors: {
      origin: ["http://localhost:5173","https://amritb.github.io"],
      methods: ["GET", "POST"]
    }
});

const rooms = [{
  roomid: "default_room",
  members: []
}];


function middleware(req, res, next) {
    var name = req.query.name;
    if (true) {
      next();
      return;
    }
    res.json({error:true})
}

app.get("/profile", middleware, (req,res) => {
    res.json({
      name:"yuva",age:19
    })
})


function addRooms(room_id) {
    var duplicate = false;
    if (!rooms.includes(room_id)) {
      rooms.push({roomid : room_id, members : []});
    }
} 



function checkifUserAlreadyJoined(roomid, username) {
   var exist = false;
    rooms.forEach(room => {
      if (room.roomid == roomid) {
        room.members.forEach(member => {
          if (member == username) exist = true
        })
      }
    })
    return exist;
}

function addMemberToGroup(roomid, username) {
  var found = false;
  rooms.forEach(room => {
    if (room.roomid == roomid) {
      found = true
      room.members.push(username)
    }
  })

  if (!found) {
    rooms.push({
      roomid,members:[username], status: "Not Started", roomObj: null
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
  var needed_room = rooms.find(room => room.roomid == roomid)
  return needed_room
}


function removeUserfromRoom(roomid, username) {
  rooms.forEach(room => {
    if (room.roomid == roomid) {
      room.members = room.members.filter(usr => usr != username);
    }
  })
}


io.on("connection", (socket) => {
    var userName = socket.handshake.query.name
    var roomid = socket.handshake.query.room_id || "default_room";

    console.log("User connected : ", userName , " request to join ", roomid)


    if (checkifUserAlreadyJoined(roomid, userName)) {
      if (isRoomHasStarted(roomid)) {
          console.log("It seems user disconnected after the auction started. Trying to reconnect him....")
          let roomObj = getRoombj(roomid)
          socket.join(roomid)
          if (roomObj.reconnect(userName, socket)) {
            console.log("reconnection success")
            socket.emit("auction-started", () => console.log("Received by user"))
          }
          return;
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

    socket.on("disconnect", () => {
      console.log(userName + " client disconnected so removed from room before starting auction");
      removeUserfromRoom(roomid, userName)
      console.log(rooms)
      io.to(roomid).emit("users_added", getUsers(roomid))
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


server.listen(port, () => console.log("Server is listening at PORT:", port))