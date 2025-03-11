import { v2 as cloudinary } from 'cloudinary';

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_SECRET, 
        api_secret: CLOUDINARY_CLOUD_NAME // Click 'View API Keys' above to copy your API secret
    });
    