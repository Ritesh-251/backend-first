import mongoose from 'mongoose'
import {DB_NAME} from "../constants.js"
function connectDB(){ return mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)};
export default connectDB;