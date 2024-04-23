const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const PORT = 7000;
const MONGOURL = "mongodb://localhost:27017/itrix";

async function connect() {
  try {
    await mongoose.connect(MONGOURL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}

connect();

const app = express();
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended:true})) // Parse JSON bodies

// Define schema for the collection
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  gender: String,
  favoriteTeam: String,
  user: String
});

// Create mongoose model for the collection
const User = mongoose.model("itrix", userSchema);

/*const reactPlay = new User({
  name: "Yogasimman",
  email: "yogasimmanravisagar@gmail.com",
  gender:"M",
  favouriteTeam:"rr",
  user:"yogasimman"
})

reactPlay.save();*/
// Function to update user's name
async function updateName(user2, name2) {
  try {
    
    await User.updateOne({ user: user2 }, { name: name2 });
    console.log("Name updated successfully");
  } catch (error) {
    console.error("Error updating name:", error);
  }
}

// Function to update user's email
async function updateEmail(user2, email2) {
  try {
    await User.updateOne({ user: user2 }, { email: email2 });
    console.log("Email updated successfully");
  } catch (error) {
    console.error("Error updating email:", error);
  }
}

// Function to update user's gender
async function updateGender(user2, gender2) {
  try {
    await User.updateOne({ user: user2 }, { gender: gender2 });
    console.log("Gender updated successfully");
  } catch (error) {
    console.error("Error updating gender:", error);
  }
}

// Function to update user's favorite team
async function updateFavoriteTeam(user2, favoriteTeam2) {
  try {
    await User.updateOne({ user: user2 }, { $set:{favoriteTeam: favoriteTeam2 }});
    console.log("Favorite team updated successfully");
  } catch (error) {
    console.error("Error updating favorite team:", error);
  }
}


// Routes
app.post("/api", async (req, res) => {
  const {username} = req.body;
  const person = await User.find({user:username}).limit(1).exec();
  res.json(person);
});

// Route to handle updating name
app.post("/updateName", async (req, res) => {
  const { user, name } = req.body;
  await updateName(user, name);
  res.sendStatus(200); // Sending success status code
});

app.post("/updateEmail",async (req,res)=>{
  const {user,email} = req.body;
  await updateEmail(user, email);
  res.sendStatus(200);
})

app.post("/updateGender",async (req,res)=>{
  const {user,gender} = req.body;
  await updateGender(user,gender);
  res.sendStatus(200);
})

app.post("/updateFavoriteTeam", async (req, res) => {
  const { user, favouriteTeam } = req.body;
  await updateFavoriteTeam(user, favouriteTeam);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("Server started on port 7000");
});





