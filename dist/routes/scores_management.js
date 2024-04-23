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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPoints = void 0;
const express_1 = require("express");
const mongodb_1 = __importDefault(require("../mongodb"));
const router = (0, express_1.Router)();
function updateUserPoints(users) {
    return mongodb_1.default.then(client => {
        const db = client.db("itrix");
        const promises = users.map(user => {
            console.log("inside promise");
            console.log(user);
            return db.collection("users").updateOne({ name: user.username }, {
                $inc: { score: user.score, matches_played: 1 },
                $set: { last_updated: new Date() }
            }, { upsert: true }).then(() => {
                if (user.rank == 1) {
                    return db.collection("users").updateOne({ name: user.username }, { $inc: { matches_won: 1 } });
                }
            });
        });
        return Promise.all(promises).then(() => {
            console.log("success updating user points");
            return { success: true };
        });
    }).catch(error => {
        console.error("Error updating user points:", error);
        return { success: false, error: error.message };
    });
}
exports.updateUserPoints = updateUserPoints;
function getCollectionDetails(collectionName) {
    return mongodb_1.default.then(client => {
        const db = client.db("itrix");
        return db.collection(collectionName).find({}).toArray();
    }).then(collectionData => {
        return {
            collectionName: collectionName,
            documentCount: collectionData.length,
            documents: collectionData
        };
    }).catch(error => {
        console.error("Error fetching collection details:", error);
        return { success: false, error: error.message };
    });
}
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = yield mongodb_1.default;
        const db = client.db("itrix");
        const users = yield db.collection("users")
            .find({})
            .sort({ score: -1 })
            .toArray();
        const response = users.map(user => {
            return {
                username: user.name,
                scores: user.score,
                matches_played: user.matches_played,
                matches_won: user.matches_won
            };
        });
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching and sorting user points:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}));
exports.default = router;
//# sourceMappingURL=scores_management.js.map