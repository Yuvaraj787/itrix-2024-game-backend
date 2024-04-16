import playersData from "./playersData.json"
import countriesData from "./countries.json"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Timestamp } from "mongodb";
import { updateUserPoints } from "./routes/scores_management";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function run(gameData) {
    try {
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  var n = gameData.length;
  var formated = {}
  for (var i = 0; i < n; i++) {
    if (formated[gameData[i].username]) {
      formated[gameData[i].username].push({
        player_name : gameData[i].player.fullname
      })
    } else {
      formated[gameData[i].username] = [];
      i--;
    }
  }
  console.log(formated)
  let len = Object.keys(formated).length
  formated = JSON.stringify(formated)
  const prompt = formated + ". Analyse these data which is collected during mock ipl auction and give the score (1-10) to the each user who picked best players and balanced team and rank (from 1 to " + len + " ) them in ascending order. format them by username, batting_score, bowling_score, overall_score, rank (respect to overall score),justification for points and array of players name picked by the corressponding user  in js object(format = [username: {rank: int, bowling_score : float, batting_score : float, justification: string, players: Array(string)}, ...]). no other thing required just give only js object. consider batting, bowling, wicket-keeping and allrounder equally (Consider all  T20 stats of these players and give fair points). start with { end with }.strictly no other things  "
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  var obj = JSON.parse(text)
  console.log(obj)
  return obj
} catch(Err) {
    console.log("Errors occured : " + Err.message)
    return {}
}
}


async function updateToDB(scores) {
    try {
        let formateArray = [];
        Object.keys(scores).map(un => {
            formateArray.push({ username: un, ...scores[un]})
        })
        return await updateUserPoints(formateArray)
    } catch (err) {
        console.log("ERROR in updating scores to db : " + err.message)
    }
}



function idToCountryName(id) {
    var arr = countriesData["data"];
    var len = arr.length;
    for (var i = 0; i < len; i++) {
        if (arr[i].id == id) {
            return {countryName : arr[i].name, flagUrl : arr[i].image_path}
        }
    }
    console.log("Country Not found");    
}

class AuctionRoom {
    io;
    roomid;
    socket;
    timerId;
    counter;
    users;
    last_bid;
    sold_players;
    unsold_players;
    allSockets;
    AvailablePlayers = playersData["data"].slice(0,120)
    typeOfTimer;
    biddingTime;
    waitingTime;

    constructor(io, socket, roomid, users, allSockets) {
        this.io = io
        this.roomid = roomid
        this.socket = socket
        this.biddingTime = 7;
        this.waitingTime = 3;
        this.counter = this.biddingTime
        this.users = {}
        console.log(users)
        users.members.forEach(user => {
            this.users[user] = {amountLeft: 100, slotsLeft: 5, disconnected: false}
        });
        this.last_bid = {
            user_name : "none",
            player: {
                id:-1
            }
        }
        this.allSockets = allSockets
        this.sold_players = []
        this.unsold_players = []
        this.AvailablePlayers.forEach(player => {
            player["basePrice"] = 5;
            player["currentPrice"] = 0;
            var countryInfo = idToCountryName(player.country_id)
            player["countryName"] = countryInfo.countryName
            player["flagUrl"] = countryInfo.flagUrl
        });
    }

    markUserHasDisconnected(username) {
        this.users[username].disconnected = true
    }

    getRandomPlayer() {
        var no = Math.floor(Math.random() * this.AvailablePlayers.length)
        return this.AvailablePlayers.splice(no, 1)[0];
    }

    isGameOver() {
        var gameOff = true;
        Object.keys(this.users).forEach(user => {
            // if (!this.users[user].disconnected)
            if (!this.users[user].disconnected && this.users[user].slotsLeft > 0) {
                if (this.users[user].amountLeft >= 5) {
                    gameOff = false
                }
            }
        })
        if (gameOff) {
            console.log("The game is over")
        }
        return gameOff;
    }

    manageTimeOut(player) {
        var str = "bid" + player.id;
        return new Promise(resolve => this.timerId = setInterval(async () => {
            if (this.counter == 0) {
                if (this.typeOfTimer == "bidding timer") {
                    if (this.last_bid.player.currentPrice == 0) {
                        this.io.to(this.roomid).emit("unsold", this.last_bid)
                    } else {
                        this.sold_players.push(this.last_bid)
                        this.users[this.last_bid.username].amountLeft -= this.last_bid.player.currentPrice
                        this.users[this.last_bid.username].slotsLeft--
                        
                        this.io.to(this.roomid).emit("sold", [this.last_bid,this.sold_players, this.users])
                    }
                    // setTimeout(() => {}, 1000)
                    if (this.isGameOver()) {
                        console.log(this.sold_players)
                        this.io.to(this.roomid).emit("game-over","game-over")
                        var scoresData = await run(this.sold_players);
                        this.io.to(this.roomid).emit("scores", scoresData)
                        updateToDB(scoresData);
                        return;
                    }

                    this.typeOfTimer = "waiting timer"
                    this.counter = this.waitingTime;

                    this.io.to(this.roomid).emit("timeout","Times out for bidding")

                    this.io.off(str, () => {})
                    return;
                }

                this.typeOfTimer = "bidding timer"
                this.counter = this.biddingTime
              
                
                clearTimeout(this.timerId)
                
                if (this.isGameOver()) {
                    console.log(this.sold_players)
                    this.io.to(this.roomid).emit("game-over","game-over")
                    var scoresData = await run(this.sold_players);
                    this.io.to(this.roomid).emit("scores", scoresData)

                } else {
                    var player = this.getRandomPlayer()
                    this.last_bid = {
                        username : "none", player
                    }
                    this.bidThisPlayer(player)
                }

            } else {
                if (this.typeOfTimer == "bidding timer") {
                    this.io.to(this.roomid).emit("counter",this.counter)
                } else {
                    this.io.to(this.roomid).emit("waiting counter",this.counter)
                }
                this.counter--
            }
        }, 1000))
    }

    reconnect(username, skt) {
        this.users[username].disconnected = false;
        let n = this.allSockets.length;
        for (let i = 0; i < n; i++) {
            if (this.allSockets[i].handshake.query.name == username) {
                this.allSockets[i] = skt
                return true
            }
        }
        return false
    }

    async bidThisPlayer(player) {
        this.io.to(this.roomid).emit("start-bidding",[player, this.users])
        this.allSockets.forEach(eachSk => {
            eachSk.on("bid" + player.id, async (msg) => {
                if (msg.player.currentPrice <= this.last_bid.player.currentPrice || this.users[msg.username].slotsLeft == 0) {
                    console.log("Not a valid bid")
                    return;
                }

                if (this.users[msg.username].amountLeft < msg.player.currentPrice) {
                    console.log("Not a valid bid")
                    return;   
                }
                
                this.last_bid = msg
                console.log(`client ${msg.username} bidded for ${player.fullname}`)
                this.io.to(this.roomid).emit("inc-bid-amount", msg)
                console.log(`Current price for the player ${msg.player.fullname} is ${msg.player.currentPrice}`)  
                this.typeOfTimer = "bidding timer"           
                this.counter = this.biddingTime
            })
        })
        await this.manageTimeOut(player)
    }

    async start() {
        console.log("Auction is started")
        // var player = this.getRandomPlayer()
        // this.last_bid = {
        //     username : "none", player
        // }
        this.typeOfTimer = "waiting timer"
        this.counter = this.waitingTime;
        await this.manageTimeOut({})
    }
}

export default AuctionRoom;