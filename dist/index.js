"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const port = 3000;
const server = http_1.default.createServer(app);
const socket = new socket_io_1.Server(3001);
socket.on("connection", () => {
    console.log("User connected");
});
server.listen(port, () => console.log("Serverr is listening at PORT:", port));
//# sourceMappingURL=index.js.map