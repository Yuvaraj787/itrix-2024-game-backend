import playersData from "./playersData.json"
import countriesData from "./countries.json"


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
    AvailablePlayers = playersData["data"].slice(0,100)
    constructor(io, socket, roomid, users, allSockets) {
        this.io = io
        this.roomid = roomid
        this.socket = socket
        this.counter = 10
        this.users = {}
        console.log(users)
        users.members.forEach(user => {
            this.users[user] = {amountLeft: 100, slotsLeft: 5}
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
        console.log(this.AvailablePlayers[0])
    }

    
    

    getRandomPlayer() {
        var no = Math.floor(Math.random() * this.AvailablePlayers.length)
        return this.AvailablePlayers.splice(no, 1)[0];
    }

    isGameOver() {
        var gameOff = true;
        console.log(this.users)
        Object.keys(this.users).forEach(user => {
            if (this.users[user].slotsLeft > 0) {
                if (this.users[user].amountLeft >= 5) {
                    gameOff = false
                }
            }
        })
        if (gameOff) {
            console.log("THe game is over")
        } else {
            console.log("THe game is not over")
        }
        return gameOff;
    }

    manageTimeOut(player) {
        var str = "bid" + player.id;
        console.log(player)
        return new Promise(resolve => this.timerId = setInterval(() => {
            if (this.counter == 0) {
                if (this.last_bid.player.currentPrice == 0) {
                    this.io.to(this.roomid).emit("unsold", player)
                } else {
                    this.sold_players.push(this.last_bid)
                    this.users[this.last_bid.username].amountLeft -= this.last_bid.player.currentPrice
                    this.users[this.last_bid.username].slotsLeft--

                    this.io.to(this.roomid).emit("sold", [this.last_bid,this.sold_players, this.users])
                }
                this.counter = 10
                this.io.to(this.roomid).emit("timeout","Times out for bidding")

                this.io.off(str, () => {})
                
                clearTimeout(this.timerId)
                
                if (this.isGameOver()) {
                    this.io.to(this.roomid).emit("game-over","game-over")
                } else {
                    var player = this.getRandomPlayer()
                    this.last_bid = {
                        username : "none", player
                    }
                    this.bidThisPlayer(player)
                }
            } else {
                this.io.to(this.roomid).emit("counter",this.counter)
                this.counter--
            }
        }, 1000))
    }

    async bidThisPlayer(player) {
        this.io.to(this.roomid).emit("start-bidding",[player, this.users])
        this.allSockets.forEach(eachSk => {
            eachSk.on("bid" + player.id, async (msg) => {
                if (msg.player.currentPrice <= this.last_bid.player.currentPrice || this.users[msg.username].slotsLeft == 0) {
                    console.log("Not a valid bid")
                    return;
                }
                this.last_bid = msg
                console.log(`client ${msg.username} bidded for ${player.fullname}`)
                this.io.to(this.roomid).emit("inc-bid-amount", msg)
                console.log(`Current price for the player ${msg.player.fullname} is ${msg.player.currentPrice}`)             
                this.counter = 10
            })
        })
        await this.manageTimeOut(player)
    }

    async start() {
        console.log("Auction is started")
        var player = this.getRandomPlayer()
        this.last_bid = {
            username : "none", player
        }
        await this.bidThisPlayer(player)
    }
}

export default AuctionRoom;