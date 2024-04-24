const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

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

async function updatePassword(user2, newPassword) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.updateOne({ user: user2 }, { password: hashedPassword });
    console.log("Password updated successfully");
  } catch (error) {
    console.error("Error updating password:", error);
  }
}

app.post("/updatePassword", async (req, res) => {
  const { user, oldPassword, newPassword } = req.body;
 
  // First, check if the old password matches the current password
  const userRecord = await User.findOne({ user: user });
  if (!userRecord) {
    return res.status(400).send({ message: "User not found" });
  }
 
  const validPassword = await bcrypt.compare(oldPassword, userRecord.password);
  if (!validPassword) {
    return res.status(400).send({ message: "Invalid old password" });
  }
 
  // If old password is correct, update the password
  await updatePassword(user, newPassword);
  res.sendStatus(200);
});

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
 
  try {
    await User.updateOne({ user: user }, { favoriteTeam: favouriteTeam });
    console.log("Favorite team updated successfully");
    res.sendStatus(200);
  } catch (error) {
    console.error("Error updating favorite team:", error);
    res.status(500).send({ message: "Error updating favorite team" });
  }
});

app.post("/create_matches_played", async(req, res) => {
  const {user} = req.body;
  const funct = (user2)=>{
    try{
      User.updateOne({ user: user2 }, { $set:{matches_played: 0 }});
      res.sendStatus(200);
    }catch(error){
      console.log("Error to create matches played");
    }
    
  }
  funct(user);
})

app.post("/create_matches_won", async(req, res) => {
  const {user} = req.body;
  const funct = (user2)=>{
    try{
      User.updateOne({ user: user2 }, { $set:{matches_won: 0 }});
      res.sendStatus(200);
    }catch(error){
      console.log("Error to create matches played");
    }
    
  }
  funct(user);
})

app.post("/checkpassword", async(req,res)=>{
  const {username} = req.body;
  const {password} = await User.find({user:username}).limit(1).exec();
  res.json({checkpassword : password});
})


app.listen(PORT, () => {
  console.log("Server started on port 7000");
});





