import { MongoClient } from "mongodb";
import { Collection } from "mongoose";

// Replace with your MongoDB connection string
const uri =
  "mongodb+srv://user_purple:test123@gamedata.esztpbe.mongodb.net/?retryWrites=true&w=majority&appName=GameData" as string;
const options = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

class Singleton {
  private static _instance: Singleton;
  private client: MongoClient;
  private clientPromise: Promise<MongoClient>;

  private constructor() {
    this.client = new MongoClient(uri, options);

    this.clientPromise = this.client.connect();

    if (process.env.NODE_ENV === "development") {
      // In development mode, use a global variable to preserve the value
      // across module reloads caused by HMR (Hot Module Replacement).
      global._mongoClientPromise = this.clientPromise;
    }
  }

  public static get instance() {
    if (!this._instance) {
      this._instance = new Singleton();
    }
    return this._instance.clientPromise;
  }
}

const clientPromise = Singleton.instance;

async function createCollections() {
  // Your asynchronous code here
  const db = (await clientPromise).db("itrix");
  const collectionName = ["users","scores"];
  

  const doesCollectionExist = await db
    .listCollections()
    .toArray()
    .then((collections) => collections.some((c) => c.name === collectionName[0]));

  const doesCollectionExistForScores = await db
    .listCollections()
    .toArray()
    .then((collections)=>collections.some((c)=>c.name === collectionName[1] ));
    const schema = {
       name : String ,
       email : String ,
       cegain : Boolean ,
       isVerfied : Boolean ,
       otp : Number ,
       validTill : Date , 
       bought_passes : Array

    };

    const scoreSchema = {
      name : String ,
      email : String ,
      password: String,
      matches_played: Number,
      Matches_won: Number,
      score: Number
    }
    const option = { validator: { $jsonSchema: schema } };
    const scoreOption = {validator : {$jsonSchema : schema}};

    console.log(doesCollectionExist)
    console.log(doesCollectionExistForScores)

  if (!doesCollectionExist) {
    await db.createCollection(collectionName[0], option);
    console.log(`Collection '${collectionName[0]}' created with schema!`);
  } else {
    console.log(`Collection '${collectionName[0]}' already exists.`);
  }

  if(!doesCollectionExistForScores){
    await db.createCollection(collectionName[1], scoreOption);
    console.log(`Collection '${collectionName[1]}' created with schema!`);
  } else {
    console.log(`Collection '${collectionName[1]}' already exists.`);
  }
}

async function deleteCollection(collectionName) {
  try {
    // Access the database
    const db = (await clientPromise).db("itrix");
    
    // Drop the collection
    await db.collection(collectionName).drop();
    
    console.log(`Collection '${collectionName}' deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting collection '${collectionName}':`, error);
  }
}
async function listCollections() {
  try {
    // Access the database
    const db = (await clientPromise).db("itrix");
    
    // List all collections
    const collections = await db.listCollections().toArray();
    
    // Extract collection names
    const collectionNames = collections.map(collection => collection.name);
    
    console.log("Existing collections:");
    console.log(collectionNames);
  } catch (error) {
    console.error("Error listing collections:", error);
  }
}

// Call the function to create collections
createCollections().then(() => {
  // After collections are created, list them
  listCollections();
});

// Export a module-scoped MongoClient promise.
// By doing this in a separate module,
// the client can be shared across functions.
export default clientPromise;

function p(value: MongoClient): MongoClient | PromiseLike<MongoClient> {
  throw new Error("Function not implemented.");
}
