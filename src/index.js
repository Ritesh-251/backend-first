import dotenv from "dotenv";
import {DB_NAME} from "./constants.js"
dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
connectDB();
      
console.log("radha radha");
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("DB_NAME:", DB_NAME);
