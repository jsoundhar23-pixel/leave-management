import "dotenv/config.js";
import mongoose from "mongoose";
import Semester from "./models/Semester.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/leaveDB";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    console.log("\n═════════════════════════════════════");
    console.log("  📚 UPDATING STUDENT MAX LEAVE LIMIT");
    console.log("═════════════════════════════════════\n");

    // Find active semester
    const activeSemester = await Semester.findOne({ active: true });
    
    if (!activeSemester) {
      console.log("❌ No active semester found!");
      process.exit(1);
    }

    console.log("Current Semester:", activeSemester.name);
    console.log("Old Max Leave Days:", activeSemester.maxLeaveDays);

    // Update to 25 days
    activeSemester.maxLeaveDays = 25;
    await activeSemester.save();

    console.log("✅ Updated Max Leave Days: 25\n");
    console.log("Duration:", new Date(activeSemester.startDate).toLocaleDateString("en-IN"), 
                "-", new Date(activeSemester.endDate).toLocaleDateString("en-IN"));
    console.log("═════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
