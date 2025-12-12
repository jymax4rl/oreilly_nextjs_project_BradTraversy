import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: [true, "Username already exists"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email already exists"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  image: {
    type: String,
    required: false,
  },
  bookmarks: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: false,
  },
  timestamps: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
    required: false,
  },
  device: {
    type: String,
    required: false,
  },
});

const User = models.User || model("User", UserSchema);
export default User;
