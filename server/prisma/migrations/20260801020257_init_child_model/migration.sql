-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "school" TEXT,
    "grade" TEXT,
    "bloodGroup" TEXT,
    "allergies" TEXT,
    "medicalConditions" TEXT,
    "profilePhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);
