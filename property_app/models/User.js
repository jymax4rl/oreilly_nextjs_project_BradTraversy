import { Schema, models, model } from "mongoose";

const UserSchema = new Schema({
  kycStatus: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: [true, "Name is required"],
  },
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
  phone: {
    type: String,
    required: [true, "Phone is required"],
    unique: [true, "Phone already exists"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: String,
    required: false,
  },
  refreshToken: {
    type: String,
    required: false,
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
