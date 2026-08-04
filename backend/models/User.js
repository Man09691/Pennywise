import mongoose from "mongoose";

const userschema = mongoose.Schema(
  {
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
},
{
    timestamps: true,
}
);

const user = mongoose.model("User", userschema);
export default user;