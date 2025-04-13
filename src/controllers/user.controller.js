import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js"; // Fixed typo: Apiresposne -> ApiResponse
import { response } from "express";
import jwt from "jsonwebtoken"
// radha radha

const generateAccessAndRefreshTokens = async (userId) => {
   try{
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave: false})
      return {accessToken,refreshToken}
   }
   catch(error){
      throw new ApiError(500,"Something went wrong while generating refresh and access token")

   }

}
const registerUser = asyncHandler(async function (req, res) {



   
   const { fullName, email, username, password } = req.body;
   console.log('Email:', email);

   // Validation: check if fields are not empty
   if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
   }


   // Check if user already exists: username or email
   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   });

   if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
   }

   // Check for avatar and cover image in request files
   const avatarLocalPath = req.files?.avatar?.[0]?.path;
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
       coverImageLocalPath = req.files.coverImage[0].path
   }
      console.log("it is req.files:    " , req.files);
   // If avatar is not provided, throw an error
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar image is required");
   }

   // Upload images to Cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

   //If avatar upload fails, throw an error
   if (!avatar) {
      throw new ApiError(400, "Failed to upload avatar image");
   }
   console.log(avatar.secure_url);
   // Proceed to create the user if everything is valid
   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "", // If coverImage exists, use the URL; otherwise, use an empty string
      email,
      password,
      username: username.toLowerCase()
   });

   // Retrieve the user without the password and refreshToken fields
   const createdUser = await User.findById(user._id).select("-password -refreshToken");

   // If user creation fails, throw an error
   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
   }

   // Return the response with the created user
   return res.status(200).json(
      new ApiResponse(200, createdUser, "User registered successfully")
   );





});

const loginUser = asyncHandler( async function(req,res){
   //todo
   //first toh we will take input from usr
   //we will fetch details from the database about the user model
   //also will check if the user given data is empty if its not we will move to step 2
   //if the info matches we will generate an access token and a refresh token
   //we willl send the access token in the header section
   //send cookies

   const {email,username,password} = req.body;
   console.log("this is the email :",email)
   console.log("this is the password;", password)
   if (!username && !email) {
      throw new ApiError(400, "username or email is required")
  }

  
   const user = await User.findOne({
      $or: [{username},{email}]
   })
   if(!user){
      throw new ApiError(404,"User does not exist");
   }
   console.log(user);
   const isPasswordValid = await user.isPasswordCorrect(password);
   console.log("it is the check",isPasswordValid);

   if(!user){
      throw new ApiError(404,"User does not exist");
   }
   if(!isPasswordValid){
      throw new ApiError(401,"Invalid user credentials");
   }
   const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)


    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    )
    console.log(loggedInUser)
    const options = {
      httpOnly: true,
      secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})
 const logoutUser = async (req,res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: undefined
         }
      },{
         new: true
      }
    )
    const options = {
      httpOnly: true,
      secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",  options)
    .json(new ApiResponse(200,{},"Users logged out successfully"));

   
}

const refreshAccessToken = asyncHandler(async(req,res) =>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
      throw new ApiError(401,"Unautherised Request")
   }
   try {
      const decodedToken2 = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   
      const user = await User.findById(decodedToken2?._id);
      if(incomingRefreshToken!=user?.refreshToken){
         throw new ApiError(401,"Unautherised Request")
      }
      const options = {
         httpOnly: true,
         secure: true
      }
      const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
      return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
         new ApiResponse(200,{accessToken,refreshToken: newRefreshToken},"Access token refreshed successfully"))
   
   }
    catch (error) {
      throw new ApiError(401,error?.message || "Invalid refresh token" )
   }

})
const changeCurrentPassword = asyncHandler(async(req,res) =>{
   const user = await User.findById(req.user._id);
   const {oldPassword,newPassword} = req.body;

   const passwordCheck = user.isPasswordCorrect(oldPassword);
   if(!passwordCheck){
      throw new ApiError(401,"Please provide the right password")
   }
    user.password = newPassword;
   await user.save({validateBeforeSave: false})

   return res.status(200).json(new ApiResponse(200,{},"Users password changed successfully")))

})

const getCurrentUser = asyncHandler(async(req,res) => {
   
   return res.status(200).json(new ApiResponse(200,req.user,"Users password changed successfully")))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
   const {fullName, email} = req.body

   if (!fullName || !email) {
       throw new ApiError(400, "All fields are required")
   }

  const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})



const updateUserAvatar = asyncHandler(async(req, res) => {
   const avatarLocalPath = req.file?.path

   if (!avatarLocalPath) {
       throw new ApiError(400, "Avatar file is missing")
   }

   //TODO: delete old image - assignment

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url) {
       throw new ApiError(400, "Error while uploading on avatar")
       
   }

   const user = await User.findByIdAndUpdate(
       req.user?._id,
       {
           $set:{
               avatar: avatar.url
           }
       },
       {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
       new ApiResponse(200, user, "Avatar image updated successfully")
   )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
   const coverImageLocalPath = req.file?.path

   if (!coverImageLocalPath) {
       throw new ApiError(400, "Cover image file is missing")
   }

   //TODO: delete old image - assignment


   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!coverImage.url) {
       throw new ApiError(400, "Error while uploading on avatar")
       
   }

   const user = await User.findByIdAndUpdate(
       req.user?._id,
       {
           $set:{
               coverImage: coverImage.url
           }
       },
       {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
       new ApiResponse(200, user, "Cover image updated successfully")
   )
})


 



 

export { registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword, 
   getCurrentUser, 
   updateUserAvatar, 
   updateUserCoverImage,
 };

