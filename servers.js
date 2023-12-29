const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
dotenv.config();
const app = express();

app.use(function(req, res, next) {
      // res.header("Access-Control-Allow-Origin", "*");
      const allowedOrigins = ['http://localhost:5000', 'https://agarbacktrial.onrender.com','https://famous-platypus-3a5ce8.netlify.app'];
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
           res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.header("Access-Control-Allow-credentials", true);
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, UPDATE");
      next();
    });
const PORT =5000;
app.use(express.static(__dirname + "/public"));
const expressServer = app.listen(PORT);

const socketio = require("socket.io");
const io = socketio(expressServer);

module.exports = { app, io };
