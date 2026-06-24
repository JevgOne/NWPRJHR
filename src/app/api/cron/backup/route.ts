import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return new Promise<NextResponse>((resolve) => {
    const backupDir = process.env.BACKUP_DIR || "/var/backups/hairora";

    exec(
      `DATABASE_URL="${process.env.DATABASE_URL}" BACKUP_DIR="${backupDir}" bash scripts/backup.sh`,
      { cwd: process.cwd(), timeout: 120_000 },
      async (error, stdout, stderr) => {
        if (error) {
          await logAudit({
            action: "BACKUP_FAILED",
            entity: "System",
            detail: { error: stderr || error.message },
          });
          resolve(
            NextResponse.json(
              { error: "Backup failed", detail: stderr || error.message },
              { status: 500 }
            )
          );
          return;
        }

        await logAudit({
          action: "BACKUP_COMPLETED",
          entity: "System",
          detail: { output: stdout.trim() },
        });

        resolve(
          NextResponse.json({
            success: true,
            output: stdout.trim(),
            timestamp: new Date().toISOString(),
          })
        );
      }
    );
  });
}
