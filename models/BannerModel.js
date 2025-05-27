const mongoose=require("mongoose")
const banner=mongoose.Schema(
    {
        type: { type: String, required: true },
        images: { type: [String], required: true }, // Ensure this matches the property used in your code
},
    { versionKey: false }
)
module.exports=mongoose.model("bannerMannage",banner)