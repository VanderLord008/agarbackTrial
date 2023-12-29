const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
const PORT =5000;
app.use(express.static(__dirname + "/public"));
const expressServer = app.listen(PORT);

const socketio = require("socket.io");
const io = socketio(expressServer);

module.exports = { app, io };
