"use server";

import { prisma } from "@/lib/prisma";

export interface StudentBatchProfile {
  matricule: string;
  wallet: string;
  studentName: string;
  department: string;
  graduationYear: number;
  totalCredits: number;
  pfeNote: number;
  academicHistory: {
    l1Average: number | null;
    l2Average: number | null;
    l3Average: number | null;
  };
}

function deriveGraduationYear(academicYear?: string | null): number {
  if (!academicYear) {
    return new Date().getFullYear();
  }

  const [startYear] = academicYear.split("-");
  const parsedYear = Number(startYear);

  if (Number.isFinite(parsedYear) && parsedYear >= 2000) {
    return parsedYear;
  }

  return new Date().getFullYear();
}

export async function getStudentBatchProfile(
  matricule: string,
): Promise<StudentBatchProfile | null> {
  const normalizedMatricule = matricule.trim();

  if (!normalizedMatricule) {
    return null;
  }

  const student = await prisma.student.findUnique({
    where: { matricule: normalizedMatricule },
    include: {
      annualAverages: {
        orderBy: { academicYear: "desc" },
        take: 5,
      },
      enrollments: {
        where: {
          course: { code: "PFE300" },
        },
        orderBy: { academicYear: "desc" },
        take: 1,
      },
    },
  });

  if (!student) {
    return null;
  }

  const annual = await prisma.annualAverage.findMany({
    where: {
      studentId: student.id,
    },
  });

  const totalCredits = annual.reduce((sum, avg) => sum + avg.totalCredits, 0);
  const latestAnnualAverage = student.annualAverages[0];
  const pfeEnrollment = student.enrollments[0];

  const academicHistory: StudentBatchProfile["academicHistory"] = {
    l1Average: null,
    l2Average: null,
    l3Average: null,
  };

  for (const average of student.annualAverages) {
    if (average.yearLevel === "L1") {
      academicHistory.l1Average = average.average * 100;
    }

    if (average.yearLevel === "L2") {
      academicHistory.l2Average = average.average * 100;
    }

    if (average.yearLevel === "L3") {
      academicHistory.l3Average = average.average * 100;
    }
  }

  if (!student.wallet) {
    throw new Error(
      "Le matricule existe mais aucun wallet n'est enregistré dans Prisma.",
    );
  }

  return {
    matricule: student.matricule,
    wallet: student.wallet,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    department: student.department ?? "Informatique",
    graduationYear:
      student.graduationYear ??
      deriveGraduationYear(latestAnnualAverage?.academicYear ?? null),
    totalCredits,
    pfeNote: pfeEnrollment?.finalNote
      ? Math.round(pfeEnrollment.finalNote * 100)
      : 0,
    academicHistory,
  };
}
