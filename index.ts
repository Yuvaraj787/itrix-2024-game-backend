require("dotenv").config();
import express from "express";
import { Server, Socket } from "socket.io";
import http from 'http';
import cors from "cors";
import AuctionRoom from "./Auction";
import axios from "axios"
import AuthRoutes from "./routes/auth"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"

const app = express()
const port = 3000
const server = http.createServer(app);


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use("/auth", AuthRoutes)
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
      roomid,members:[username]
    })

  }
  console.log(rooms);
}

function getUsers(roomid) {
  var needed_room = rooms.find(room => room.roomid == roomid)
  return needed_room
}

io.on("disconnect", (socket) => {
  console.log("client disconnected")
})

io.on("connection", (socket) => {
    var userName = socket.handshake.query.name
    var roomid = socket.handshake.query.room_id || "default_room";

    console.log("User connected : ", userName , " request to join ", roomid)
    if (checkifUserAlreadyJoined(roomid, userName)) {
      console.log("user already on room so no restricted to join again")
      return;
    } else {
      addMemberToGroup(roomid,userName)
    }

    socket.join(roomid)
    io.to(roomid).emit("users_added", getUsers(roomid))
    socket.on("start-auction",async (msg) => {
      console.log("auction started")
      io.to(roomid).emit("auction-started", "start")
      const allSockets = await io.in(roomid).fetchSockets()
      allSockets.forEach(sk => {
        console.log("sent to ",sk.handshake.query.name)
      })
      var auction_room = new AuctionRoom(io, socket, roomid, getUsers(roomid), allSockets);
      auction_room.start()
    })
})

server.listen(port, () => console.log("Server is listening at PORT :", port))