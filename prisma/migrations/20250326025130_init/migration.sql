-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorRequest" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "hexColor" TEXT NOT NULL,
    "imagery" TEXT NOT NULL,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "ColorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ColorRequest_inputText_idx" ON "ColorRequest"("inputText");

-- AddForeignKey
ALTER TABLE "ColorRequest" ADD CONSTRAINT "ColorRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
