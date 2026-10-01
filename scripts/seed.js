const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set. Create a .env.local file with your connection string.");
  process.exit(1);
}

const SEED_ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@cdlj.com").trim().toLowerCase();
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!SEED_ADMIN_PASSWORD || SEED_ADMIN_PASSWORD.length < 12) {
  console.error(
    "❌ SEED_ADMIN_PASSWORD must be set (min. 12 characters). Example:\n" +
      '   SEED_ADMIN_PASSWORD="$(openssl rand -base64 24)" node scripts/seed.js'
  );
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  roles: [String],
  actif: { type: Boolean, default: true },
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seed() {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(MONGODB_URI);

    console.log(`Checking if SuperAdmin '${SEED_ADMIN_EMAIL}' exists...`);
    const existing = await User.findOne({ email: SEED_ADMIN_EMAIL });
    if (existing) {
      console.log(`SuperAdmin '${SEED_ADMIN_EMAIL}' already exists.`);
      process.exit(0);
    }

    console.log("Creating SuperAdmin user...");
    const hashedPassword = await bcryptjs.hash(SEED_ADMIN_PASSWORD, 12);

    await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: SEED_ADMIN_EMAIL,
      password: hashedPassword,
      roles: ["SUPERADMIN"],
      actif: true,
    });

    console.log("✅ SuperAdmin successfully created!");
    console.log(`Email: ${SEED_ADMIN_EMAIL}`);
    console.log("Password: (the SEED_ADMIN_PASSWORD you provided — not printed)");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
