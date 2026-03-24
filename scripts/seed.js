const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set. Create a .env.local file with your connection string.");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  roles: [String],
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seed() {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(MONGODB_URI);

    console.log("Checking if SuperAdmin exists...");
    const existing = await User.findOne({ email: "admin@cdlj.com" });
    if (existing) {
      console.log("SuperAdmin 'admin@cdlj.com' already exists.");
      process.exit(0);
    }

    console.log("Creating SuperAdmin user...");
    const hashedPassword = await bcryptjs.hash("Admin2026", 10);

    await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: "admin@cdlj.com",
      password: hashedPassword,
      roles: ["SUPERADMIN"],
    });

    console.log("✅ SuperAdmin successfully created!");
    console.log("Email: admin@cdlj.com");
    console.log("Password: Admin2026");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
