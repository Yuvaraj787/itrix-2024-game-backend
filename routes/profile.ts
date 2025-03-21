import { Router } from "express";
import clientPromise from '../mongodb';
import { middleware } from "./auth";

const router = Router();

// Routes
router.get("/api", middleware, async (req, res) => {
    try {
        console.log("triggered")
    const client = await clientPromise;
    const db = client.db("itrixed");
    const User = db.collection("usersed")
    const person = await User.findOne({ email: req.data.email });
    console.log(req.data.email, person)
    res.json(person);
    } catch (err) {
        console.log("Error in fetching user profile ", err.message)
    }
});

router.get("/api/others",  async (req, res) => {
    try {
    const client = await clientPromise;
    const db = client.db("itrixed");
    const User = db.collection("usersed")
    const person = await User.findOne({ name: req.query.name });
        console.log("triigered", person)
    res.json(person);
    } catch (err) {
        console.log("Error in fetching profile of others : ", err.message)
    }
});

router.post("/updateFavoriteTeam", middleware, async (req, res) => {
    try {
        console.log("post triggered")
        const { favouriteTeam } = req.body;
        var email = req.data.email;
        const client = await clientPromise;
        const db = client.db("itrixed");
        const User = db.collection("usersed")
        await User.updateOne({ email }, { $set: {favoriteTeam: favouriteTeam} });
        console.log("Favorite team updated successfully");
        res.sendStatus(200);
    } catch (error) {
        console.error("Error updating favorite team:", error);
        res.status(500).send({ message: "Error updating favorite team" });
    }
});


export default router;