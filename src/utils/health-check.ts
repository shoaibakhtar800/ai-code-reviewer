import { prisma } from "@/lib/prisma";

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    console.log("✅ Database connection is healthy.");
    return { status: "ok", message: "Connected" };
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return { status: "error", message: "Disconnected" };
  }
}
