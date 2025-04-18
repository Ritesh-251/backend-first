import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });



console.log('Cloudinary Config:')
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME)
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY)
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET)


cloudinary.config({ 
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY, 
   api_secret: process.env.CLOUDINARY_API_SECRET
 });
    
    export const uploadOnCloudinary = async function (localfilePath) {
        try {
           
            console.log(localfilePath)
           if (!localfilePath) return null; // if the file path is not provided, return null
     
           // Uploading the image to Cloudinary
           const response = await cloudinary.uploader.upload(localfilePath, {
              resource_type: "auto" // automatically determines the file type
           });
     
           // Remove the file from the server after upload
           fs.unlinkSync(localfilePath);
     
            console.log("cloudinary returned :",response);
           return response; // Return the URL of the uploaded image
     
        } catch (error) {
           console.error('Error uploading file to Cloudinary:', error);
     
           // Ensure the file is removed even if there was an error
           if (fs.existsSync(localfilePath)) {
              fs.unlinkSync(localfilePath);
           }
     
           return null; // Return null if upload failed
        }
     }