import { Router } from "express";
import clientPromise from '../mongodb.ts';

const router = Router();

// Function to update individual user points and related data
function updateUserPoints(users) {
  return clientPromise.then(client => {
    // Access the database
    const db = client.db("itrix");

    // Create an array of promises for each user update
    const promises = users.map(user => {
        console.log("inside promise");
      console.log(user);
      return db.collection("scores").updateOne(
        { username: user.username }, // Filter by username
        {
          $inc: { score: user.score, matches_played: 1 }, // Increment score and matches_played
          $set: { last_updated: new Date() } // Set last_updated field to current date
        },
        { upsert: true } // Add this option to insert a new document if the document doesn't exist
      ).then(() => {
        // If user rank is 1, increment matches_won count
        if (user.rank === 1) {
          return db.collection("scores").updateOne(
            { username: user.username }, // Filter by username
            { $inc: { matches_won: 1 } } // Increment matches_won count
          );
        }
      });
    });

    // Return a promise that resolves when all user updates are completed
    return Promise.all(promises).then(() => {
      return { success: true };
    });
  }).catch(error => {
    // Error response
    console.error("Error updating user points:", error);
    return { success: false, error: error.message };
  });
}

// Function to fetch collection details and return them in JSON format
function getCollectionDetails(collectionName) {
  return clientPromise.then(client => {
    // Access the database
    const db = client.db("itrix");

    // Get collection details
    return db.collection(collectionName).find({}).toArray();
  }).then(collectionData => {
    // Return collection details in JSON format
    return {
      collectionName: collectionName,
      documentCount: collectionData.length,
      documents: collectionData
    };
  }).catch(error => {
    // Error response
    console.error("Error fetching collection details:", error);
    return { success: false, error: error.message };
  });
}

// Route handler for PUT request
router.put("/", (req, res) => {
  // Extract array of user objects from request body
  const users = req.body;
 

  // Call the function to update user points and related data
  updateUserPoints(users).then(result => {
    // Send response
    res.json(result);
  }).catch(error => {
    // Send error response
    res.status(500).json({ success: false, error: error.message });
  });
});

// Route to get the updated data
router.get("/", (req, res) => {
  getCollectionDetails("scores").then(collectionDetails => {
    console.log(JSON.stringify(collectionDetails, null, 2));
    res.send("true");
  }).catch(error => {
    console.error("Error:", error);
    res.send("false");
  });
});

export default router;
