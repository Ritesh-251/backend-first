import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

import {asyncHandler} from "../utils/asyncHandler.js"
import { response } from "express"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Please write something");
    }
    
    const owner = req.user._id;
    const tweet = await Tweet.create({
        content,
        owner

    });
    return res.status(200).json(new ApiResponse(200,tweet,"tweet created successfully"));

})

const getUserTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;
    const skip = (page - 1) * limit;
    const tweets = await Tweet.find({ owner: req.user._id })
    .skip(skip)  // Skip the records based on the page
    .limit(limit)  // Limit the number of tweets returned
    .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 })  // Sort the tweets based on the query
    .populate("owner", "username email");  // Populate owner field with username and email


    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"));

    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    const {editedTweet} = req.body;
    const { tweetId } = req.params;//we are gettting tweet id in params
    const existingTweet = await Tweet.findById(tweetId);//you should check if the tweet exists
    if (!existingTweet) throw new ApiError(404, "Tweet not found");
    if (existingTweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to edit this tweet");
     }//you should check about the ownership
     

    
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,{
        $set: {
            content:editedTweet,
        }},{
            new:true
        })
        return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweets updated successfully"));
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const tweet =  await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this tweet");
     }
     await Tweet.findByIdAndDelete(tweetId);
    return res.status(200).json(new ApiResponse(200,{},"deleted tweet successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}