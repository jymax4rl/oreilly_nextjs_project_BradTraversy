import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: [true, "Email already exists"],
      required: [true, "Email is required"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    image: {
      type: String,
    },
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Property",
      },
    ],
    //role and host status
    role: {
      type: String,
      enum: ["guest", "host", "admin"],
      default: "guest",
    },
    hostStatus: {
      type: String,
      enum: ["none", "onboarding", "verified", "rejected"],
      default: "none",
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || model("User", UserSchema);
export default User;
