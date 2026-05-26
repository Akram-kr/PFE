import { Semester, YearLevel, AdmissionStatus } from "../src/generated/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log(
    "🌱 Starting complete LMD (License & Master) database seeding...",
  );

  // 1. Clear existing data (Strict order to prevent Foreign Key constraint crashes)
  await prisma.annualAverage.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();

  console.log("🧹 Cleaned up all old data structures.");

  // 2. Create Core Courses for L1, L2, L3, M1, and M2 (Ensure total credits equal 30 per semester)
  console.log("📚 Populating academic courses...");
  const coursesData = [
    // === L1 HIERARCHY ===
    {
      code: "MATH101",
      name: "Analysis 1",
      credits: 9,
      coefficient: 3.0,
      semester: Semester.S1,
      yearLevel: YearLevel.L1,
    },
    {
      code: "CS101",
      name: "Algorithms 1",
      credits: 9,
      coefficient: 3.0,
      semester: Semester.S1,
      yearLevel: YearLevel.L1,
    },
    {
      code: "ST101",
      name: "Probability & Stats",
      credits: 6,
      coefficient: 2.0,
      semester: Semester.S1,
      yearLevel: YearLevel.L1,
    },
    {
      code: "ENG101",
      name: "Technical English 1",
      credits: 6,
      coefficient: 1.0,
      semester: Semester.S1,
      yearLevel: YearLevel.L1,
    },

    {
      code: "MATH102",
      name: "Algebra 1",
      credits: 9,
      coefficient: 3.0,
      semester: Semester.S2,
      yearLevel: YearLevel.L1,
    },
    {
      code: "CS102",
      name: "Algorithms 2",
      credits: 9,
      coefficient: 3.0,
      semester: Semester.S2,
      yearLevel: YearLevel.L1,
    },
    {
      code: "ST102",
      name: "Information Systems",
      credits: 6,
      coefficient: 2.0,
      semester: Semester.S2,
      yearLevel: YearLevel.L1,
    },
    {
      code: "ENG102",
      name: "Technical English 2",
      credits: 6,
      coefficient: 1.0,
      semester: Semester.S2,
      yearLevel: YearLevel.L1,
    },

    // === L2 HIERARCHY ===
    {
      code: "CS201",
      name: "Database Systems (BD)",
      credits: 8,
      coefficient: 3.0,
      semester: Semester.S3,
      yearLevel: YearLevel.L2,
    },
    {
      code: "CS202",
      name: "Operating Systems 1",
      credits: 8,
      coefficient: 3.0,
      semester: Semester.S3,
      yearLevel: YearLevel.L2,
    },
    {
      code: "MATH201",
      name: "Numerical Analysis",
      credits: 8,
      coefficient: 2.0,
      semester: Semester.S3,
      yearLevel: YearLevel.L2,
    },
    {
      code: "CS205",
      name: "Graph Theory",
      credits: 6,
      coefficient: 2.0,
      semester: Semester.S3,
      yearLevel: YearLevel.L2,
    },

    {
      code: "CS203",
      name: "Web Development",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S4,
      yearLevel: YearLevel.L2,
    },
    {
      code: "CS204",
      name: "Object-Oriented Prog (OOP)",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S4,
      yearLevel: YearLevel.L2,
    },
    {
      code: "CS206",
      name: "Computer Networks",
      credits: 10,
      coefficient: 2.0,
      semester: Semester.S4,
      yearLevel: YearLevel.L2,
    },

    // === L3 HIERARCHY ===
    {
      code: "CS301",
      name: "Software Engineering",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S5,
      yearLevel: YearLevel.L3,
    },
    {
      code: "CS302",
      name: "Information Security",
      credits: 10,
      coefficient: 2.0,
      semester: Semester.S5,
      yearLevel: YearLevel.L3,
    },
    {
      code: "CS305",
      name: "Artificial Intelligence",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S5,
      yearLevel: YearLevel.L3,
    },

    {
      code: "CS303",
      name: "Distributed Systems & Cloud",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S6,
      yearLevel: YearLevel.L3,
    },
    {
      code: "PFE300",
      name: "Graduation Project (PFE)",
      credits: 20,
      coefficient: 5.0,
      semester: Semester.S6,
      yearLevel: YearLevel.L3,
    },

    // === M1 HIERARCHY ===
    {
      code: "CS401",
      name: "Advanced Database Architectures",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S1,
      yearLevel: YearLevel.M1,
    },
    {
      code: "CS402",
      name: "Applied Cryptography & Network Security",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S1,
      yearLevel: YearLevel.M1,
    },
    {
      code: "CS403",
      name: "Operations Research & Optimization",
      credits: 10,
      coefficient: 2.0,
      semester: Semester.S1,
      yearLevel: YearLevel.M1,
    },

    {
      code: "CS404",
      name: "Distributed Algorithms",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S2,
      yearLevel: YearLevel.M1,
    },
    {
      code: "CS405",
      name: "Machine Learning Foundations",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S2,
      yearLevel: YearLevel.M1,
    },
    {
      code: "CS406",
      name: "Mobile App Development",
      credits: 10,
      coefficient: 2.0,
      semester: Semester.S2,
      yearLevel: YearLevel.M1,
    },

    // === M2 HIERARCHY ===
    {
      code: "CS501",
      name: "Cloud Native Computing & DevOps",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S3,
      yearLevel: YearLevel.M2,
    },
    {
      code: "CS502",
      name: "Blockchain & Decentralized Systems",
      credits: 10,
      coefficient: 3.0,
      semester: Semester.S3,
      yearLevel: YearLevel.M2,
    },
    {
      code: "CS503",
      name: "Big Data & Analytics",
      credits: 10,
      coefficient: 2.0,
      semester: Semester.S3,
      yearLevel: YearLevel.M2,
    },

    {
      code: "PFE500",
      name: "Master Thesis / Graduation Project",
      credits: 30,
      coefficient: 6.0,
      semester: Semester.S4,
      yearLevel: YearLevel.M2,
    },
  ];

  const dbCourses = [];
  for (const course of coursesData) {
    const created = await prisma.course.create({ data: course });
    dbCourses.push(created);
  }
  console.log(`✅ Tracked ${dbCourses.length} structured courses in database.`);

  // 3. Create Sample Students
  console.log("🧑‍🎓 Provisioning student profiles...");
  const student1 = await prisma.student.create({
    data: {
      matricule: "202331000001",
      firstName: "Amine",
      lastName: "Rahmani",
      email: "amine.rahmani@univ.dz",
      currentYear: YearLevel.L3,
    },
  });
  const student2 = await prisma.student.create({
    data: {
      matricule: "202431000002",
      firstName: "Sarah",
      lastName: "Benali",
      email: "sarah.benali@univ.dz",
      currentYear: YearLevel.L2,
    },
  });
  const student3 = await prisma.student.create({
    data: {
      matricule: "202531000003",
      firstName: "Anis",
      lastName: "Mansouri",
      email: "anis.mansouri@univ.dz",
      currentYear: YearLevel.L1,
    },
  });

  const academicYear = "2025-2026";

  // ==========================================
  // CASE 1: AMINE (L3) - ADMIS PAR MOYENNE (>= 10)
  // ==========================================
  console.log("📝 Generating records for Amine (Passes via high average)...");
  const l3Courses = dbCourses.filter((c) => c.yearLevel === YearLevel.L3);

  const amineGrades: Record<
    string,
    { cc: number; exam: number; final: number }
  > = {
    CS301: { cc: 14, exam: 12, final: 12.8 },
    CS302: { cc: 15, exam: 11, final: 12.6 },
    CS305: { cc: 13, exam: 10, final: 11.2 },
    CS303: { cc: 16, exam: 14, final: 14.8 },
    PFE300: { cc: 17, exam: 16, final: 16.4 },
  };

  for (const course of l3Courses) {
    const grades = amineGrades[course.code];
    await prisma.enrollment.create({
      data: {
        studentId: student1.id,
        courseId: course.id,
        academicYear,
        ccNote: grades.cc,
        examNote: grades.exam,
        finalNote: grades.final,
        isPassed: grades.final >= 10,
      },
    });
  }

  await prisma.transcript.createMany({
    data: [
      {
        studentId: student1.id,
        semester: Semester.S5,
        yearLevel: YearLevel.L3,
        academicYear,
        average: 12.15,
        totalCredits: 30,
      },
      {
        studentId: student1.id,
        semester: Semester.S6,
        yearLevel: YearLevel.L3,
        academicYear,
        average: 15.8,
        totalCredits: 30,
      },
    ],
  });

  // Amine's historical annual progression records (L1 -> L2 -> L3)
  const loopsAmine = [YearLevel.L1, YearLevel.L2, YearLevel.L3];
  const academicYearsAmine = ["2023-2024", "2024-2025", "2025-2026"];

  for (let i = 0; i < 3; i++) {
    await prisma.annualAverage.create({
      data: {
        studentId: student1.id,
        yearLevel: loopsAmine[i],
        academicYear: academicYearsAmine[i],
        average: 11.2 + i * 1.3,
        totalCredits: 60,
        status: AdmissionStatus.ADMIS_MOYENNE,
      },
    });
  }

  // ==========================================
  // CASE 2: SARAH (L2) - ADMIS PAR CREDITS
  // ==========================================
  console.log(
    "📝 Generating records for Sarah (Passes via LMD Credit Rule)...",
  );
  const l2Courses = dbCourses.filter((c) => c.yearLevel === YearLevel.L2);

  const sarahGrades: Record<
    string,
    { cc: number; exam: number; final: number }
  > = {
    CS201: { cc: 12, exam: 11, final: 11.4 },
    CS202: { cc: 14, exam: 10, final: 11.6 },
    MATH201: { cc: 11, exam: 12, final: 11.6 },
    CS205: { cc: 10, exam: 10, final: 10.0 },
    CS203: { cc: 8, exam: 5, final: 6.2 },
    CS204: { cc: 9, exam: 6, final: 7.2 },
    CS206: { cc: 7, exam: 4, final: 5.2 },
  };

  for (const course of l2Courses) {
    const grades = sarahGrades[course.code];
    await prisma.enrollment.create({
      data: {
        studentId: student2.id,
        courseId: course.id,
        academicYear,
        ccNote: grades.cc,
        examNote: grades.exam,
        finalNote: grades.final,
        isPassed: grades.final >= 10,
      },
    });
  }

  await prisma.transcript.createMany({
    data: [
      {
        studentId: student2.id,
        semester: Semester.S3,
        yearLevel: YearLevel.L2,
        academicYear,
        average: 11.22,
        totalCredits: 30,
      },
      {
        studentId: student2.id,
        semester: Semester.S4,
        yearLevel: YearLevel.L2,
        academicYear,
        average: 6.32,
        totalCredits: 0,
      },
    ],
  });

  // Sarah's annual tracking sequence (L1 -> L2)
  const loopsSarah = [YearLevel.L1, YearLevel.L2];
  const academicYearsSarah = ["2024-2025", "2025-2026"];

  for (let i = 0; i < 2; i++) {
    await prisma.annualAverage.create({
      data: {
        studentId: student2.id,
        yearLevel: loopsSarah[i],
        academicYear: academicYearsSarah[i],
        average: i === 0 ? 10.5 : 8.77,
        totalCredits: i === 0 ? 60 : 30,
        status:
          i === 0
            ? AdmissionStatus.ADMIS_MOYENNE
            : AdmissionStatus.ADMIS_CREDITS,
      },
    });
  }

  // ==========================================
  // CASE 3: ANIS (L1) - AJOURNE (Failed)
  // ==========================================
  console.log("📝 Generating records for Anis (Ajourné)...");
  const l1Courses = dbCourses.filter((c) => c.yearLevel === YearLevel.L1);

  const anisGrades: Record<
    string,
    { cc: number; exam: number; final: number }
  > = {
    MATH101: { cc: 8, exam: 6, final: 6.8 },
    CS101: { cc: 11, exam: 10, final: 10.4 },
    ST101: { cc: 6, exam: 5, final: 5.4 },
    ENG101: { cc: 12, exam: 10, final: 10.8 },
    MATH102: { cc: 5, exam: 4, final: 4.4 },
    CS102: { cc: 8, exam: 7, final: 7.4 },
    ST102: { cc: 7, exam: 6, final: 6.4 },
    ENG102: { cc: 10, exam: 10, final: 10.0 },
  };

  for (const course of l1Courses) {
    const grades = anisGrades[course.code];
    await prisma.enrollment.create({
      data: {
        studentId: student3.id,
        courseId: course.id,
        academicYear,
        ccNote: grades.cc,
        examNote: grades.exam,
        finalNote: grades.final,
        isPassed: grades.final >= 10,
      },
    });
  }

  await prisma.transcript.createMany({
    data: [
      {
        studentId: student3.id,
        semester: Semester.S1,
        yearLevel: YearLevel.L1,
        academicYear,
        average: 7.82,
        totalCredits: 15,
      },
      {
        studentId: student3.id,
        semester: Semester.S2,
        yearLevel: YearLevel.L1,
        academicYear,
        average: 6.55,
        totalCredits: 6,
      },
    ],
  });

  await prisma.annualAverage.create({
    data: {
      studentId: student3.id,
      yearLevel: YearLevel.L1,
      academicYear,
      average: 7.18,
      totalCredits: 21,
      status: AdmissionStatus.AJOURNE,
    },
  });

  console.log(
    "🎉 Database seeding completed successfully with all LMD pathways including Master Tiers!",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding runtime failure:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
