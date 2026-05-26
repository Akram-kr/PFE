import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL, // Or whatever your variable name is
});

async function testConnection() {
  try {
    console.log("🔄 Attempting to connect to the cloud database...");
    await client.connect();
    console.log(
      "✅ SUCCESS! The database URL in your .env file works perfectly.",
    );

    const res = await client.query("SELECT NOW()");
    console.log(`🕒 Server Time from Database: ${res.rows[0].now}`);

    await client.end();
  } catch (error) {
    console.error("❌ CONNECTION FAILED!");
    console.error(error);
  }
}

testConnection();
