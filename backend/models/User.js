import mongoose from "mongoose";

const userSchema = mongoose.Schema(
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

const user = mongoose.model("User", userSchema);
export default user;