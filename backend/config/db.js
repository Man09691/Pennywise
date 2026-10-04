import mongoose from "mongoose";

const MONGO_OPTIONS = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
};

let isConnecting = false;
let reconnectTimer = null;
let shuttingDown = false;

const connectWithRetry = async (attempt = 1) => {
  if (shuttingDown || isConnecting) {
    return;
  }

  // If Mongoose is already connected, do nothing.
  if (mongoose.connection.readyState === 1) {
    return;
  }

  isConnecting = true;

  try {
    await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    const delay = Math.min(2 ** attempt * 1000, 60000);

    console.error(
      `❌ MongoDB connection failed (attempt ${attempt}): ${error.message}`
    );

    console.log(`🔄 Retrying in ${delay / 1000}s...`);

    if (!shuttingDown && !reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectWithRetry(attempt + 1);
      }, delay);
    }
  } finally {
    isConnecting = false;
  }
};

const connectDB = () => {
  mongoose.connection.on("connected", () => {
    console.log("✅ Mongoose connected to Atlas");
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");

    if (!shuttingDown) {
      console.log("🔄 Starting MongoDB reconnect...");
      connectWithRetry();
    }
  });

  mongoose.connection.on("error", (error) => {
    console.error("❌ Mongoose connection error:", error.message);
  });

  process.on("SIGINT", async () => {
    shuttingDown = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    await mongoose.connection.close();

    console.log("MongoDB connection closed on app termination");
    process.exit(0);
  });

  connectWithRetry();
};

export default connectDB;