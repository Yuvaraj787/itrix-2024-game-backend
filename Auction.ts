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
    constructor(io, socket, roomid, users, allSockets) {
        this.io = io
        this.roomid = roomid
        this.socket = socket
        this.counter = 10
        this.users = {}
        console.log(users)
        users.members.forEach(user => {
            this.users[user] = 100
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
    }

    AvailablePlayers = [
        { "id": 14, "name": "Rohit", "category": "Batsman", "basePrice": 8, "currentPrice": 0, "country": "India", "foreignPlayer": false, "age": 34, "handType": "Right Handed", "bowlingType": "Not a bowler" },
        { "id": 15, "name": "Warner", "category": "Batsman", "basePrice": 7, "currentPrice": 0, "country": "Australia", "foreignPlayer": true, "age": 35, "handType": "Left Handed", "bowlingType": "Not a bowler" },
        { "id": 16, "name": "Smith", "category": "Batsman", "basePrice": 6, "currentPrice": 0, "country": "Australia", "foreignPlayer": true, "age": 32, "handType": "Right Handed", "bowlingType": "Not a bowler" },
        { "id": 17, "name": "Bumrah", "category": "Bowler", "basePrice": 9, "currentPrice": 0, "country": "India", "foreignPlayer": false, "age": 29, "handType": "Right Arm Fast", "bowlingType": "Fast bowler" },
        { "id": 18, "name": "Stokes", "category": "All-rounder", "basePrice": 10, "currentPrice": 0, "country": "England", "foreignPlayer": true, "age": 30, "handType": "Left Handed", "bowlingType": "Medium fast" },
        { "id": 19, "name": "Williamson", "category": "Batsman", "basePrice": 7, "currentPrice": 0, "country": "New Zealand", "foreignPlayer": true, "age": 31, "handType": "Right Handed", "bowlingType": "Not a bowler" },
        { "id": 20, "name": "Smith", "category": "Batsman", "basePrice": 6, "currentPrice": 0, "country": "Australia", "foreignPlayer": true, "age": 32, "handType": "Right Handed", "bowlingType": "Not a bowler" },
        { "id": 21, "name": "Pant", "category": "Wicket-keeper Batsman", "basePrice": 8, "currentPrice": 0, "country": "India", "foreignPlayer": false, "age": 25, "handType": "Left Handed", "bowlingType": "Not a bowler" },
        { "id": 22, "name": "Cummins", "category": "Bowler", "basePrice": 9, "currentPrice": 0, "country": "Australia", "foreignPlayer": true, "age": 28, "handType": "Right Arm Fast", "bowlingType": "Fast bowler" },
        { "id": 23, "name": "Buttler", "category": "Wicket-keeper Batsman", "basePrice": 7, "currentPrice": 0, "country": "England", "foreignPlayer": true, "age": 30, "handType": "Right Handed", "bowlingType": "Not a bowler" },
        { "id": 24, "name": "Rashid", "category": "Bowler", "basePrice": 8, "currentPrice": 0, "country": "Afghanistan", "foreignPlayer": true, "age": 23, "handType": "Right Arm Leg Spin", "bowlingType": "Leg Spinner" },
        { "id": 25, "name": "Babar", "category": "Batsman", "basePrice": 9, "currentPrice": 0, "country": "Pakistan", "foreignPlayer": true, "age": 27, "handType": "Right Handed", "bowlingType": "Not a bowler" },
        { "id": 26, "name": "Kane", "category": "Batsman", "basePrice": 8, "currentPrice": 0, "country": "New Zealand", "foreignPlayer": true, "age": 31, "handType": "Right Handed", "bowlingType": "Not a bowler" },
        { "id": 27, "name": "Shami", "category": "Bowler", "basePrice": 7, "currentPrice": 0, "country": "India", "foreignPlayer": false, "age": 30, "handType": "Right Arm Fast", "bowlingType": "Fast bowler" },
        { "id": 28, "name": "Archer", "category": "Bowler", "basePrice": 9, "currentPrice": 0, "country": "England", "foreignPlayer": true, "age": 26, "handType": "Right Arm Fast", "bowlingType": "Fast bowler" },
        { "id": 29, "name": "Rohit", "category": "Batsman", "basePrice": 8, "currentPrice": 0, "country": "India", "foreignPlayer": false, "age": 34, "handType": "Right Handed", "bowlingType": "Not a bowler" },
        { "id": 30, "name": "Morgan", "category": "Batsman", "basePrice": 7, "currentPrice": 0, "country": "England", "foreignPlayer": true, "age": 35, "handType": "Left Handed", "bowlingType": "Not a bowler" },
        { "id": 31, "name": "Pujara", "category": "Batsman", "basePrice": 6, "currentPrice": 0, "country": "India", "foreignPlayer": false, "age": 34, "handType": "Right Handed", "bowlingType": "Not a bowler" },
        { "id": 32, "name": "Lyon", "category": "Bowler", "basePrice": 8, "currentPrice": 0, "country": "Australia", "foreignPlayer": true, "age": 33, "handType": "Right Arm Off Spin", "bowlingType": "Off Spinner" }
    ]
      

    getRandomPlayer() {
        var no = Math.floor(Math.random() * this.AvailablePlayers.length)
        return this.AvailablePlayers.splice(no, 1)[0];
    }

    manageTimeOut(player) {
        var str = "bid" + player.id;
        console.log(player)
        return new Promise(resolve => this.timerId = setInterval(() => {
            if (this.counter == 0) {
                console.log("Times out for the player", player)
                if (this.last_bid.player.currentPrice == 0) {
                    this.io.to(this.roomid).emit("unsold", player)
                } else {
                    this.sold_players.push(this.last_bid)
                    this.users[this.last_bid.username] -= this.last_bid.player.currentPrice
                    this.io.to(this.roomid).emit("sold", [this.last_bid,this.sold_players, this.users])
                }
                this.counter = 10
                this.io.to(this.roomid).emit("timeout","Times out for bidding")
                this.io.off(str,() => {
                    console.log("Bidding closed for " + this.last_bid.player.id)
                })
                clearTimeout(this.timerId)
                console.log("Next player taken")
                if (this.AvailablePlayers.length == 0) {
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
                // console.log(this.counter)
                this.counter--
            }
        }, 1000))
    }

    async bidThisPlayer(player) {
        this.io.to(this.roomid).emit("start-bidding",[player, this.users])
        console.log(`Players. Start bidding` , player)
        this.allSockets.forEach(eachSk => {
            eachSk.on("bid" + player.id, async (msg) => {
                if (msg.player.currentPrice <= this.last_bid.player.currentPrice) {
                    console.log("Not a valid bid")
                    return;
                }
                this.last_bid = msg
                console.log(msg)
                console.log(`client bidded for ${player.name}`)
                this.io.to(this.roomid).emit("inc-bid-amount", msg);
                console.log(`Current price for the player ${msg.player.name} is ${msg.player.currentPrice}`)             
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