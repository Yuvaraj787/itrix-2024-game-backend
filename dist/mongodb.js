"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
// Replace with your MongoDB connection string
const uri = "mongodb+srv://user_purple:test123@gamedata.esztpbe.mongodb.net/?retryWrites=true&w=majority&appName=GameData";
const options = {};
class Singleton {
    constructor() {
        this.client = new mongodb_1.MongoClient(uri, options);
        this.clientPromise = this.client.connect();
        if (process.env.NODE_ENV === "development") {
            // In development mode, use a global variable to preserve the value
            // across module reloads caused by HMR (Hot Module Replacement).
            global._mongoClientPromise = this.clientPromise;
        }
    }
    static get instance() {
        if (!this._instance) {
            this._instance = new Singleton();
        }
        return this._instance.clientPromise;
    }
}
const clientPromise = Singleton.instance;
function createCollections() {
    return __awaiter(this, void 0, void 0, function* () {
        // Your asynchronous code here
        const db = (yield clientPromise).db("itrix");
        const collectionName = ["users"];
        const doesCollectionExist = yield db
            .listCollections()
            .toArray()
            .then((collections) => collections.some((c) => c.name === collectionName[0]));
        const schema = {
            name: String,
            email: String,
            cegian: Boolean,
            isVerfied: Boolean,
            otp: Number,
            validTill: Date,
            bought_passes: Array,
            password: String,
            matches_played: Number,
            matches_won: Number,
            score: Number
        };
        const option = { validator: { $jsonSchema: schema } };
        console.log(doesCollectionExist);
        if (!doesCollectionExist) {
            yield db.createCollection(collectionName[0], option);
            console.log(`Collection '${collectionName[0]}' created with schema!`);
        }
        else {
            console.log(`Collection '${collectionName[0]}' already exists.`);
        }
    });
}
createCollections();
// Export a module-scoped MongoClient promise.
// By doing this in a separate module,
// the client can be shared across functions.
exports.default = clientPromise;
function p(value) {
    throw new Error("Function not implemented.");
}
//# sourceMappingURL=mongodb.js.map