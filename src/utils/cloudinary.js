import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_SECRET, 
        api_secret: process.env.ACCESS_SECRET_KEY
    });
    
   export  const uploadOnCloudinary = async function (localfilePath){
        try{
        if(!localfilePath) return null;
        const response = await cloudinary.uploader.upload(localfilePath,{
            resource_type:"auto"
        })
        fs.unlinkSync(localfilePath);

        console.log("file has been uploaded",response.url);
    }catch(error){
        fs.unlinkSync(localfilePath);
        return null;


    }


    
}
