-- AlterTable users: add telegram fields
ALTER TABLE "users" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "users" ADD COLUMN "telegramLinkToken" TEXT;
CREATE UNIQUE INDEX "users_telegramLinkToken_key" ON "users"("telegramLinkToken");

-- AlterTable tasks: add reminder fields
ALTER TABLE "tasks" ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN "reminderOffsets" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- CreateTable reminders_sent
CREATE TABLE "reminders_sent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "offsetMins" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminders_sent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reminders_sent_taskId_offsetMins_key" ON "reminders_sent"("taskId", "offsetMins");

ALTER TABLE "reminders_sent" ADD CONSTRAINT "reminders_sent_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
