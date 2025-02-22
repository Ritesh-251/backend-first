import mongoose from 'mongoose'
import {DB_NAME} from "../constants.js"
function connectDB(){ return mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`).then(
    () => {
        console.log("Connected to MongoDB successfully DB HOST :");
      }).catch((error) => {
        console.error("ERROR:", error);
        process.exit(1);
      })};
export default connectDB;