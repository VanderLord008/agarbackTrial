const io = require("../servers").io;
const app = require("../servers").app;

const Orb = require("./classes/Orb");
const Player = require("./classes/Player");
const PlayerConfig = require("./classes/PlayerConfig");
const PlayerData = require("./classes/PlayerData");
const checkForOrbCollisions =
  require("./checkCollisions").checkForOrbCollisions;
const checkForPlayerCollisions =
  require("./checkCollisions").checkForPlayerCollisions;

//make an orbs array that will host all non-player orbs
//everytime one is absorbed the server will make a new one
const orbs = [];
const players = [];
const playersForUsers = [];
let tickTokInterval;
const settings = {
  defaultNumberOfOrbs: 5000,
  defaultSpeed: 6,
  defaultSize: 6,
  defaultZoom: 1.5,
  worldWidth: 5000,
  worldHeight: 5000,
  defaultGenericOrbSize: 5,
};
initGame();

io.on("connect", (socket) => {
  let player = {};
  //this event runs on join
  socket.on("init", (playerObj, ackCallback) => {
    //someone is about to join the game so start tick tocking
    if (players.length === 0) {
      //tic-tok=issue an event every 33 milli seconds to get 30fps
      tickTokInterval = setInterval(() => {
        io.to("game").emit("tick", playersForUsers);
      }, 16);
    }

    socket.join("game");
    const playerName = playerObj.playerName;
    // make a playerConfig object - the data specific to this player that only the player needs to know
    const playerConfig = new PlayerConfig(settings);
    // make a playerData object - the data specific to this player that everyone needs to know
    const playerData = new PlayerData(playerName, settings);
    // a master player object to house both
    player = new Player(socket.id, playerConfig, playerData);
    players.push(player); //server use only
    playersForUsers.push({ playerData });
    ackCallback({ orbs, indexInPlayers: playersForUsers.length - 1 });
    console.log("connection established");
  });

  socket.on("tock", (data) => {
    // a tock has come before the player cout set up
    //due to client kept tocking after disconnecting
    if (!player.playerConfig) {
      return;
    }
    speed = 10;
    const xV = (player.playerConfig.xVector = data.xVector);
    const yV = (player.playerConfig.yVector = data.yVector);
    //if player can move in x then move
    if (
      (player.playerData.locX > 5 && xV < 0) ||
      (player.playerData.locX < settings.worldWidth && xV > 0)
    ) {
      player.playerData.locX += speed * xV;
    }
    //if player can move in the y then move
    if (
      (player.playerData.locY > 5 && yV > 0) ||
      (player.playerData.locY < settings.worldHeight && yV < 0)
    ) {
      player.playerData.locY -= speed * yV;
    }

    // check for tocking players collision with orbs and get its index
    const capturedOrbI = checkForOrbCollisions(
      player.playerData,
      player.playerConfig,
      orbs,
      settings
    );
    if (capturedOrbI !== null) {
      //since index could be 0 we check for not null
      //remove the orb collided and replace it with a new orb
      orbs.splice(capturedOrbI, 1, new Orb(settings));

      //now update the clients about the newly created orb
      const orbData = {
        capturedOrbI,
        newOrb: orbs[capturedOrbI],
      };
      //emit to all sockets playing the game about it
      io.to("game").emit("orbSwitch", orbData);
      io.to("game").emit("updateLeaderBoard", getLeaderBoard());
    }

    //check for player collisions
    const absorbData = checkForPlayerCollisions(
      player.playerData,
      player.playerConfig,
      players,
      playersForUsers,
      socket.id
    );
    if (absorbData) {
      io.to("game").emit("playerAbsorbed", absorbData);
      io.to("game").emit("updateLeaderBoard", getLeaderBoard());
    }
  });

  socket.on("disconnect", () => {
    //to find any disconnected player
    for (let i = 0; i < players.length; i++) {
      if (players[i].socketId === player.socketId) {
        //splice this disconnected user out of the array
        players.splice(i, 1, {});
        playersForUsers.splice(i, 1, {});
        break;
      }
    }
    //check to see if players is empty if it is then stop ticking
    if (players.length === 0) {
      clearInterval(tickTokInterval);
    }
  });
});

//on server start make all the initial orbs
function initGame() {
  for (let i = 0; i < settings.defaultNumberOfOrbs; i++) {
    orbs.push(new Orb(settings));
  }
}

function getLeaderBoard() {
  const leaderBoardArray = players.map((curPlayer) => {
    if (curPlayer.playerData) {
      return {
        name: curPlayer.playerData.name,
        score: curPlayer.playerData.score,
      };
    } else {
      return {};
    }
  });
  return leaderBoardArray;
}
