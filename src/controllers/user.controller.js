import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js"; // Fixed typo: Apiresposne -> ApiResponse

const registerUser = asyncHandler(async function (req, res) {
   
   const { fullName, email, username, password } = req.body;
   console.log('Email:', email);

   // Validation: check if fields are not empty
   if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
   }
   console.log("it is the req.body :" ,  req.body);

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

   // If avatar upload fails, throw an error
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

export { registerUser };
