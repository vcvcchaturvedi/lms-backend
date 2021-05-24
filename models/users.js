import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
  imag: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  isTutor: {
    type: Boolean,
    default: "false",
    required: false,
  },
  coursesEnrolled: {
    ids: [{ type: String, required: true }],
    required: false,
  },
  emailid: {
    type: String,
    required: true,
    unique: true,
  },
});
userSchema.pre("save", async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
    console.log(this.username, this.password);
  } catch (err) {
    console.log(err);
  }
});
export const User = mongoose.model("User", userSchema);
