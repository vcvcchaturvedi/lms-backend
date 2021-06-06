import mongoose from "mongoose";
import bcrypt from "bcrypt";
const courseSchema = new mongoose.Schema({
  image: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  chapters: [
    {
      url: {
        type: String,
        required: true,
      },
      chapterTitle: {
        type: String,
        required: true,
      },
    },
  ],
});

export const Course = mongoose.model("course", courseSchema);
