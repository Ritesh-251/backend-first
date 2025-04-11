import { ApiError } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asynHandler.js";

const registerUser = asyncHandler(async function (req,res){
   const {fullName,email,username,password} = req.body
   console.log('Email:', email);
})
export {registerUser,};