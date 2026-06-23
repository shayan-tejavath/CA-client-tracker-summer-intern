import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log("URI:", mongoUri);

    if (!mongoUri) {
      throw new Error(
        "Missing required environment variable MONGODB_URI. Create backend/.env from backend/.env.example and restart."
      );
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;