import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const tweetSchema =  new Schema({
    content:{
        type:String,
        required:true,
    },
    owner:{
        type:Schema.Typer.ObjectID,
        ref:"User"
    }
    
},{
timestamps:true 
})
tweetSchema.plugin(mongooseAggregatePaginate);
export const Tweet = mongoose.model('Tweet',tweetSchema);