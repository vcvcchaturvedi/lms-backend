import mongoose from "mongoose";
import bcrypt from "bcrypt";
const courseSchema = new mongoose.Schema({
  imag: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: true,
    unique: true,
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
      exercises: [
        {
          title: {
            type: String,
            required: true,
          },
          problemURL: {
            type: String,
            required: true,
          },
          solutionURL: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
});

export const Course = mongoose.model("course", courseSchema);
