import { Router } from "express";
import clientPromise from '../mongodb';


const router = Router();

function updateUserPoints(users) {
  return clientPromise.then(client => {
    const db = client.db("itrixed");

    const promises = users.map(user => {
      console.log("inside promise");
      console.log(user);
      return db.collection("usersed").updateOne(
        { name: user.username }, 
        {
          $inc: { score: user.score, matches_played: 1 }, 
          $set: { last_updated: new Date() } 
        },
        { upsert: true } 
      ).then(() => {
        
        if (user.rank == 1) {
          return db.collection("usersed").updateOne(
            { name: user.username }, 
            { $inc: { matches_won: 1 } } 
          );
        }
      });
    });

    
    return Promise.all(promises).then(() => {
      console.log("success updating user points")
      return { success: true };
    });
  }).catch(error => {
    console.error("Error updating user points:", error);
    return { success: false, error: error.message };
  });
}

function getCollectionDetails(collectionName) {
  return clientPromise.then(client => {
    const db = client.db("itrixed");

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

router.get("/", async (req, res) => {
    try {
      const client = await clientPromise;
      const db = client.db("itrixed");
      
      const users = await db.collection("usersed")
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
    } catch (error) {
      console.error("Error fetching and sorting user points:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
export {updateUserPoints}
export default router;
