const express = require("express");
const { createServer } = require("node:http");
const app = express();

app.use(express.static("public"));

const server = createServer(app);
server.listen(3000, () => {
  console.log("Webserver started at http://localhost:3000");
});

const { Server } = require("socket.io");
const io = new Server(server);

let clientWindows = {};

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("boid", (data) => {
    socket.broadcast.emit("boid", data);
  });

  socket.on("windowPosition", (data) => {
    clientWindows[socket.id] = data;
    io.emit("windowUpdate", { id: socket.id, data });
  });

  socket.on("disconnect", () => {
    delete clientWindows[socket.id];
    io.emit("windowUpdate", { id: socket.id, data: null });
    console.log(`Client disconnected: ${socket.id}`);
  });
});