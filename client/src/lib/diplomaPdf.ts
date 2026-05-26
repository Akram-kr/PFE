import puppeteer from "puppeteer";

export interface DiplomaTemplateData {
  batchId: string;
  studentName: string;
  deplome: "Master" | "Licence";
  matricule: string;
  department: string;
  graduationYear: number;
  totalCredits: number;
  pfeNote: number;
  l1Average: number | null;
  l2Average: number | null;
  l3Average: number | null;
  m1Average: number | null;
  m2Average: number | null;
  deanAddress: string;
  rectorAddress: string;
  universityName?: string;
  issueDate?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatAverage(value: number | null): string {
  if (value === null) return "Non disponible";
  return `${(value / 100).toFixed(2)} / 20`;
}

function formatNote(value: number): string {
  return `${(value / 100).toFixed(2)} / 20`;
}

// ─── inline SVG logo (crescent + book, Algerian green & gold) ─────────────────

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <radialGradient id="blida-green-grad" cx="35%" cy="30%" r="65%" fx="35%" fy="30%">
      <stop offset="0%" stop-color="#76D73C" />
      <stop offset="45%" stop-color="#00923F" />
      <stop offset="85%" stop-color="#005B26" />
      <stop offset="100%" stop-color="#003615" />
    </radialGradient>
  </defs>

  <g fill="url(#blida-green-grad)">
    <path d="M 190 60 
             C 140 70, 70 140, 50 220 
             C 25 320, 80 410, 170 440 
             C 245 465, 310 420, 340 375 
             C 300 420, 220 440, 160 410 
             C 90 375, 65 290, 95 210 
             C 120 140, 175 90, 230 75 
             C 215 70, 200 65, 190 60 Z" />

    <path d="M 280 120 
             C 230 115, 160 170, 140 240 
             C 120 310, 145 380, 210 410 
             C 175 370, 165 315, 175 250 
             C 185 180, 235 140, 280 145 
             C 260 160, 240 190, 240 220 
             C 240 255, 275 290, 305 260 
             C 270 270, 255 240, 258 215 
             C 262 180, 295 145, 315 130 
             C 305 125, 292 122, 280 120 Z" />

    <path d="M 190 60 
             C 170 65, 135 90, 145 105 
             C 155 115, 175 100, 195 85 
             C 185 80, 188 70, 190 60 Z" />

    <path d="M 335 125 
             C 370 125, 430 150, 430 195 
             C 430 235, 385 245, 355 245 
             L 415 245 
             C 455 245, 475 280, 475 320 
             C 475 345, 450 365, 420 365 
             L 470 365 
             L 470 375 
             L 370 375 
             L 370 365 
             L 395 365 
             C 435 365, 450 340, 450 315 
             C 450 270, 400 255, 355 255 
             L 345 255 
             L 345 320 
             C 345 360, 390 380, 425 380 
             L 435 380 
             L 435 390 
             C 385 390, 325 365, 325 310 
             L 325 245 
             L 300 245 
             L 300 235 
             L 325 235 
             L 325 155 
             C 325 135, 310 135, 295 135 
             L 295 125 
             L 335 125 Z 
             M 345 140 
             L 345 235 
             L 370 235 
             C 405 235, 415 215, 415 190 
             C 415 155, 385 140, 345 140 Z" />

    <circle cx="305" cy="180" r="16" />
  </g>
</svg>
`;

const LOGO_URI = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString("base64")}`;

// ─── HTML builder ─────────────────────────────────────────────────────────────

export function buildDiplomaHtml(data: DiplomaTemplateData): string {
  const issueDate = data.issueDate ?? new Date().toISOString().slice(0, 10);
  const universityName =
    data.universityName ?? "Université Saad Dahleb — Blida 1";

  const GREEN = "#006233";
  const GOLD = "#c8a84b";

  const degreeAr =
    data.deplome === "Master" ? "شهادة الماستر" : "شهادة الليسانس";
  const degreeFr = `Diplôme de ${data.deplome}`;

  // Build grade rows
  const gradeRows: [string, string][] = [
    ["Première année Licence (L1)", formatAverage(data.l1Average)],
    ["Deuxième année Licence (L2)", formatAverage(data.l2Average)],
    ["Troisième année Licence (L3)", formatAverage(data.l3Average)],
  ];
  if (data.deplome === "Master") {
    gradeRows.push(
      ["Première année Master (M1)", formatAverage(data.m1Average)],
      ["Deuxième année Master (M2)", formatAverage(data.m2Average)],
    );
  }
  gradeRows.push(
    ["Note de PFE", formatNote(data.pfeNote)],
    ["Crédits validés", `${data.totalCredits} ECTS`],
  );

  const rowsHtml = gradeRows
    .map(
      ([label, val]) =>
        `<tr><td>${label}</td><td class="score">${val}</td></tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${degreeFr} — ${data.studentName}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Times New Roman", Times, serif;
      background: #fff;
      color: #1a1a1a;
      width: 210mm;
      min-height: 297mm;
    }

    /* ── outer decorative border ── */
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 14mm 16mm 12mm;
      border: 12px solid ${GREEN};
      box-shadow: inset 0 0 0 4px ${GOLD};
      position: relative;
    }

    /* corner ornaments */
    .corner {
      position: absolute;
      width: 28px; height: 28px;
      border-color: ${GOLD};
      border-style: solid;
    }
    .tl { top: 8px;    left: 8px;   border-width: 3px 0 0 3px; }
    .tr { top: 8px;    right: 8px;  border-width: 3px 3px 0 0; }
    .bl { bottom: 8px; left: 8px;   border-width: 0 0 3px 3px; }
    .br { bottom: 8px; right: 8px;  border-width: 0 3px 3px 0; }

    /* ── header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px double ${GREEN};
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .header-text-left {
      text-align: left;
      font-size: 12px;
      color: ${GREEN};
      line-height: 1.7;
      font-weight: bold;
    }
    .header-text-right {
      text-align: right;
      font-size: 12px;
      color: ${GREEN};
      line-height: 1.7;
      font-weight: bold;
      direction: rtl;
      font-family: Arial, sans-serif;
    }
    .logo-wrap {
      text-align: center;
      flex-shrink: 0;
      padding: 0 10px;
    }
    .logo-wrap img { width: 90px; height: 90px; }

    /* ── faculty line ── */
    .faculty {
      text-align: center;
      font-size: 12.5px;
      color: #333;
      margin-bottom: 4px;
      font-style: italic;
      letter-spacing: 0.03em;
    }
    .faculty-ar {
      text-align: center;
      font-size: 13px;
      direction: rtl;
      font-family: Arial, sans-serif;
      color: #555;
      margin-bottom: 10px;
    }

    /* ── title band ── */
    .title-band {
      background: ${GREEN};
      color: #fff;
      text-align: center;
      padding: 10px 0 8px;
      margin: 12px 0 10px;
      border-top: 3px solid ${GOLD};
      border-bottom: 3px solid ${GOLD};
    }
    .title-band .degree-fr {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .title-band .degree-ar {
      font-size: 18px;
      direction: rtl;
      font-family: Arial, sans-serif;
      margin-top: 4px;
      opacity: 0.92;
    }

    /* ── certify paragraph ── */
    .certify {
      font-size: 13.5px;
      line-height: 1.9;
      text-align: justify;
      margin: 12px 0 8px;
    }
    .certify strong { color: ${GREEN}; font-size: 15px; }
    .certify em     { color: #444; }

    /* ── grades table ── */
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: ${GREEN};
      border-left: 4px solid ${GOLD};
      padding-left: 8px;
      margin: 14px 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    table.grades {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin-bottom: 14px;
    }
    table.grades th {
      background: ${GREEN};
      color: #fff;
      padding: 6px 10px;
      text-align: left;
      font-weight: bold;
    }
    table.grades td {
      padding: 5px 10px;
      border-bottom: 1px solid #d4d4d4;
    }
    table.grades tr:nth-child(even) td { background: #f0f7f2; }
    table.grades td.score {
      font-weight: bold;
      color: ${GREEN};
      text-align: center;
    }

    /* ── blockchain box ── */
    .chain-box {
      border: 1px solid ${GOLD};
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 10.5px;
      color: #555;
      margin-bottom: 14px;
      background: #fffdf4;
    }
    .chain-label {
      font-weight: bold;
      color: ${GOLD};
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .mono { font-family: "Courier New", monospace; font-size: 10px; word-break: break-all; }

    /* ── signatures ── */
    .sig-row {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      gap: 20px;
    }
    .sig-block { text-align: center; flex: 1; font-size: 12px; }
    .sig-title {
      font-weight: bold;
      color: ${GREEN};
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .sig-line { border-top: 1.5px solid #1a1a1a; margin: 36px 10px 6px; }
    .sig-addr { font-family: "Courier New", monospace; font-size: 8.5px; color: #666; word-break: break-all; }

    /* ── footer ── */
    .footer {
      text-align: center;
      font-size: 10px;
      color: #888;
      border-top: 1px solid #ccc;
      padding-top: 8px;
      margin-top: 10px;
    }
    .gold { color: ${GOLD}; }
  </style>
</head>
<body>
<div class="page">
  <!-- corner ornaments -->
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>

  <!-- header -->
  <div class="header">
    <div class="header-text-left">
      République Algérienne Démocratique et Populaire<br/>
      Ministère de l'Enseignement Supérieur<br/>
      et de la Recherche Scientifique<br/>
      <span style="font-size:13px;">${universityName}</span>
    </div>
    <div class="logo-wrap">
      <img src="${LOGO_URI}" alt="Logo Université"/>
    </div>
    <div class="header-text-right">
      الجمهورية الجزائرية الديمقراطية الشعبية<br/>
      وزارة التعليم العالي والبحث العلمي<br/><br/>
      جامعة سعد دحلب — البليدة 1
    </div>
  </div>

  <!-- faculty line -->
  <div class="faculty">Faculté des Sciences — Département de <em>${data.department}</em></div>
  <div class="faculty-ar">كلية العلوم — قسم الإعلام الآلي</div>

  <!-- title band -->
  <div class="title-band">
    <div class="degree-fr">${degreeFr}</div>
    <div class="degree-ar">${degreeAr}</div>
  </div>

  <!-- certifying paragraph -->
  <div class="certify">
    Le Recteur de l'<strong>${universityName}</strong> certifie que
    <strong>M./Mme ${data.studentName}</strong>, portant le numéro matricule
    <strong class="mono">${data.matricule}</strong>, inscrit(e) au département de
    <em>${data.department}</em>, a accompli avec succès l'ensemble des exigences académiques
    du parcours <strong>${data.deplome}</strong> et est déclaré(e) titulaire dudit diplôme
    au titre de l'année universitaire
    <strong>${data.graduationYear - 1} / ${data.graduationYear}</strong>,
    ayant validé un total de <strong>${data.totalCredits} crédits ECTS</strong>.
  </div>

  <!-- grade table -->
  <div class="section-title">&#x1F4CB; Relevé des moyennes annuelles</div>
  <table class="grades">
    <thead>
      <tr>
        <th>Année d'étude</th>
        <th style="text-align:center;">Moyenne</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- blockchain authenticity -->
  <div class="chain-box">
    <div class="chain-label">&#x1F517; Authentification DiploChain — Lot #${data.batchId}</div>
    <b>Doyen :</b> <span class="mono">${data.deanAddress}</span><br/>
    <b>Recteur :</b> <span class="mono">${data.rectorAddress}</span><br/>
    <b>CID IPFS :</b> <span class="mono" style="color:#aaa;">à insérer après upload</span>
    &nbsp;|&nbsp; <b>Date d'émission :</b> ${issueDate}
  </div>

  <!-- signatures -->
  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-title">Le Doyen de la Faculté</div>
      <div class="sig-line"></div>
      <div>Signature &amp; Cachet officiel</div>
      <div class="sig-addr">${data.deanAddress}</div>
    </div>
    <div class="sig-block" style="flex:0.5;display:flex;align-items:flex-end;justify-content:center;">
      <div style="text-align:center;font-size:11px;color:#888;padding-bottom:8px;">
        Fait à Blida, le <strong>${issueDate}</strong><br/>
        <span style="color:${GOLD};font-weight:bold;">Cachet de l'Université</span>
      </div>
    </div>
    <div class="sig-block">
      <div class="sig-title">Le Recteur de l'Université</div>
      <div class="sig-line"></div>
      <div>Signature &amp; Cachet officiel</div>
      <div class="sig-addr">${data.rectorAddress}</div>
    </div>
  </div>

  <!-- footer -->
  <div class="footer">
    Document généré automatiquement par <strong>DiploChain</strong> —
    Batch <span class="gold">#${data.batchId}</span> —
    ${universityName} &copy; ${data.graduationYear}
  </div>
</div>
</body>
</html>`;
}

// ─── PDF renderer (unchanged from original) ───────────────────────────────────

export async function renderDiplomaPdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
