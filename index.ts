const express = require("express")
const { Server } = require("socket.io");
const app = express()
const portServer = 3000;
const portSocket = 3001;

const io = new Server(portSocket);

app.listen(portServer, () => console.log("Server is listening at PORT:", portServer))