import postgres from "postgres";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL || "";
const apiUrl = process.env.PHOTO_API_URL || "http://localhost:3000/api/photo-generation";

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set");
}

console.log(`[Queue Listener] Connecting to database...`);
console.log(`[Queue Listener] API endpoint: ${apiUrl}`);

const sql = postgres(databaseUrl);

async function forwardJobToApi(jobData: any) {
  try {
    console.log(`[Queue Listener] Forwarding job ${jobData.id} to API...`);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Queue Listener] API error for job ${jobData.id}: ${response.status} ${errorText}`
      );
      return;
    }

    const result = await response.json();
    console.log(`[Queue Listener] ✅ Job ${jobData.id} processed successfully`);
  } catch (error) {
    console.error(`[Queue Listener] Error forwarding job ${jobData.id}:`, error);
  }
}

async function listenToQueue() {
  console.log(`[Queue Listener] Listening on channel 'photo_generation_queue_channel'...`);

  const stream = sql.listen("photo_generation_queue_channel", (payload) => {
    try {
      console.log(`[Queue Listener] 📨 Received notification:`, payload);
      const jobData = typeof payload === "string" ? JSON.parse(payload) : payload;
      // Handle both direct job object and wrapped in 'job' key
      const actualJob = jobData.job || jobData;
      console.log(`[Queue Listener] 📋 Parsed job ID: ${actualJob.id}`);
      forwardJobToApi(actualJob);
    } catch (error) {
      console.error("[Queue Listener] Error parsing notification:", error);
      console.error("[Queue Listener] Raw payload:", payload);
    }
  });

  console.log(`[Queue Listener] ✅ Ready! Waiting for queue notifications...`);
  console.log(`[Queue Listener] Press Ctrl+C to stop`);

  // Keep process alive
  process.on("SIGINT", async () => {
    console.log("\n[Queue Listener] Shutting down...");
    await sql.end();
    process.exit(0);
  });
}

listenToQueue().catch((error) => {
  console.error("[Queue Listener] Fatal error:", error);
  process.exit(1);
});

