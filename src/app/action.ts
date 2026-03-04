"use server";
import { checkDatabaseHealth } from "@/utils/health-check";

export async function runHealthCheckAction() {
  return await checkDatabaseHealth();
}
