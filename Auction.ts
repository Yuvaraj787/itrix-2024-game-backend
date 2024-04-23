import playersData from "./playersData.json"
import countriesData from "./countries.json"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyToken } from "./utils";
import { Timestamp } from "mongodb";
import { updateUserPoints } from "./routes/scores_management";
import { deleteRoom } from "./index";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function run(gameData) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        var n = gameData.length;
        var formObj = {}
        for (var i = 0; i < n; i++) {
            if (formObj[gameData[i].username]) {
                formObj[gameData[i].username].push({
                    player_name: gameData[i].player.fullname
                })
            } else {
                formObj[gameData[i].username] = [];
                i--;
            }
        }

        var len = Object.keys(formObj).length
        var users = Object.keys(formObj)
        var missing = {

        }

        for (let i = 0; i < len; i++) {
            missing[users[i]] = {
                batting_score: 0,
                bowling_score: 0,
                overall_score: 0,
                players: formObj[users[i]].map(e => e.player_name),
                justification: '-'
            }
        }

        var missing_str = JSON.stringify(missing)
        console.log(missing_str)
        const prompt = missing_str + ". These data contains information of various users and their respective cricket team players. now fill the batting_score (0 - 10), bowling_score(0 - 10), overall_score(0 - 10), rank and justification based on their balance of the team (consider the batting, bowling, captain and wicket-keeper and provide fair points for each field and justification (reason for your points)).Strictly No other things required. just fill the required fields (instead of 0 and '-') and just give the js stringified object (I parse your response with JSON.parse() so give response such that parse() doesnt throw any errors)"


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        var obj = JSON.parse(text)
        console.log("Gemini provided results")
        const resArr = []
        for (let i = 0; i < len; i++) {
            let us = users[i];
            resArr.push({
                ...obj[us],
                username: us,
                players: missing[us].players,
            })
        }
        resArr.sort((a, b) => b.overall_score - a.overall_score)
        resArr.forEach((e, i) => e.rank = i + 1)
        console.log(resArr)
        return resArr
    } catch (Err) {
        console.log("Errors occured : " + Err.message)
        return {}
    }
}


async function updateToDB(scores) {:
    try {
        let formateArray = [];
        Object.keys(scores).map(un => {
            formateArray.push({ username: un, ...scores[un] })
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
            return { countryName: arr[i].name, flagUrl: arr[i].image_path }
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
    AvailablePlayers = playersData["data"].slice(0, 120)
    typeOfTimer;
    biddingTime;
    waitingTime;

    constructor(io, socket, roomid, users, allSockets) {
        this.io = io
        this.roomid = roomid
        this.socket = socket
        this.biddingTime = 7;
        this.waitingTime = 2;
        this.counter = this.biddingTime
        this.users = {}
        console.log(users)
        users.members.forEach(user => {
            this.users[user] = { amountLeft: 100, slotsLeft: 5, disconnected: false }
        });
        this.last_bid = {
            user_name: "none",
            player: {
                id: -1
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
        try {
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
        } catch (err) {
            console.log("Error in gameover func", err.message)
        }
    }

    manageTimeOut(player) {
        try {
            var str = "bid" + player.id;
            return new Promise(resolve => this.timerId = setInterval(async () => {
                if (this.counter == 0) {
                    if (this.typeOfTimer == "bidding timer") {
                        this.io.off(str, () => { })
                        if (this.last_bid.player.currentPrice == 0) {
                            this.io.to(this.roomid).emit("unsold", this.last_bid)
                        } else {
                            this.sold_players.push(this.last_bid)
                            this.users[this.last_bid.username].amountLeft -= this.last_bid.player.currentPrice
                            this.users[this.last_bid.username].slotsLeft--

                            this.io.to(this.roomid).emit("sold", [this.last_bid, this.sold_players, this.users])
                        }
                        // setTimeout(() => {}, 1000)
                        this.typeOfTimer = "waiting timer"
                        this.counter = this.waitingTime;

                        this.io.to(this.roomid).emit("timeout", "Times out for bidding")

                        return;
                    }

                    this.typeOfTimer = "bidding timer"
                    this.counter = this.biddingTime


                    clearTimeout(this.timerId)

                    if (this.isGameOver()) {
                        deleteRoom(this.roomid)
                        console.log(this.sold_players)
                        this.io.to(this.roomid).emit("game-over", "game-over")
                        var scoresData = await run(this.sold_players);
                        this.io.to(this.roomid).emit("scores", JSON.stringify(scoresData))
                        var format = scoresData.map(e => { return { username: e.username, score: e.overall_score } })
                        var result = updateUserPoints(format)
                        if ((await result).success) {
                            console.log("points updated successfully")
                        } else {
                            console.log("Error in updating points to db : ", result.error)
                        }
                    } else {
                        var player = this.getRandomPlayer()
                        this.last_bid = {
                            username: "none", player
                        }
                        this.bidThisPlayer(player)
                    }

                } else {
                    if (this.typeOfTimer == "bidding timer") {
                        this.io.to(this.roomid).emit("counter", this.counter)
                    } else {
                        this.io.to(this.roomid).emit("waiting counter", this.counter)
                    }
                    this.counter--
                }
            }, 1000))
        } catch (err) {
            console.log("error in manage this player function : ", err.message)
        }
    }

    reconnect(username, token, skt) {
        try {
            this.users[username].disconnected = false;
            let n = this.allSockets.length;
            for (let i = 0; i < n; i++) {
                if (this.allSockets[i].handshake.query.token == token) {
                    this.allSockets[i] = skt
                    return true
                }
            }
        } catch (err) {
            console.log("Error in reconnection ", err.message)
        }
        return false
    }

    async bidThisPlayer(player) {
        try {
            this.io.to(this.roomid).emit("start-bidding", [player, this.users])
            let users = [];
            this.allSockets.forEach(eachSk => {
                eachSk.on("bid" + player.id, async (msg) => {
                    const verifiedName = verifyToken(msg.token);
                    if (msg.username != verifiedName) {
                        console.log("something wrong")
                    }

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
                eachSk.on("skip" + player.id, async (msg) => {
                    if (!users.includes(msg)) {
                        users.push(msg)
                        this.io.to(this.roomid).emit("skip", users.length)
                    }
                    this.io.to(this.roomid).emit("skip", users)
                    if (users.length == this.allSockets.length) {
                        this.counter = 1;
                    }
                })
            })
            await this.manageTimeOut(player)
        } catch (err) {
            console.log("Error in bid player func ", err.message)
        }
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