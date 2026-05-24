import puppeteer from "puppeteer";

export interface DiplomaTemplateData {
  batchId: string;
  studentName: string;
  matricule: string;
  department: string;
  graduationYear: number;
  totalCredits: number;
  pfeNote: number;
  l1Average: number | null;
  l2Average: number | null;
  l3Average: number | null;
  deanAddress: string;
  rectorAddress: string;
  universityName?: string;
  issueDate?: string;
}

function formatAverage(value: number | null): string {
  if (value === null) {
    return "Non disponible";
  }

  return `${(value / 100).toFixed(2)} / 20`;
}

function formatNote(value: number): string {
  return `${(value / 100).toFixed(2)} / 20`;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function buildDiplomaHtml(data: DiplomaTemplateData): string {
  const issueDate = data.issueDate ?? new Date().toISOString().slice(0, 10);
  const universityName = data.universityName ?? "Université de Blida 1";

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Diplôme — ${data.studentName}</title>
    <style>
      @page {
        size: A4;
        margin: 18mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
        background: linear-gradient(180deg, #eff6ff 0%, #ffffff 50%, #f8fafc 100%);
      }

      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 24mm 18mm;
        position: relative;
      }

      .badge {
        display: inline-block;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        letter-spacing: 0.02em;
        color: #0f172a;
        background: rgba(255, 255, 255, 0.88);
      }

      .hero {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 22px;
      }

      .hero h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.1;
        color: #0f172a;
      }

      .hero p {
        margin: 8px 0 0;
        font-size: 14px;
        color: #334155;
      }

      .hero strong {
        color: #0f172a;
      }

      .seal {
        width: 86px;
        height: 86px;
        border-radius: 50%;
        background: linear-gradient(145deg, #0f172a 0%, #1d4ed8 100%);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 700;
        text-align: center;
        box-shadow: 0 16px 32px rgba(29, 78, 216, 0.2);
      }

      .intro {
        margin: 10px 0 22px;
        max-width: 720px;
        font-size: 15px;
        line-height: 1.7;
        color: #334155;
      }

      .grid {
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 18px;
        margin-top: 20px;
      }

      .card {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid #dbeafe;
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      }

      .card h2 {
        margin: 0 0 12px;
        font-size: 16px;
        color: #0f172a;
      }

      .label {
        display: block;
        font-size: 11px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 4px;
      }

      .value {
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 12px;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }

      .table th,
      .table td {
        border-bottom: 1px solid #e2e8f0;
        padding: 10px 0;
        font-size: 13px;
        text-align: left;
      }

      .table th {
        color: #64748b;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .signature-block {
        margin-top: 28px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .signature-line {
        border-top: 1px solid #0f172a;
        margin-top: 42px;
        padding-top: 8px;
        font-size: 12px;
        color: #334155;
      }

      .footer {
        position: absolute;
        bottom: 14mm;
        left: 18mm;
        right: 18mm;
        font-size: 11px;
        color: #475569;
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }

      .mono {
        font-family: "Courier New", monospace;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="hero">
        <div>
          <div class="badge">Lot #${data.batchId}</div>
          <h1>Diplôme de fin d'études</h1>
          <p>
            <strong>${universityName}</strong><br />
            Attestation d'obtention des crédits et de la validation de la PFE.
          </p>
        </div>
        <div class="seal">UD</div>
      </div>

      <p class="intro">
        Le présent diplôme atteste que <strong>${data.studentName}</strong>, matricule
        <strong>${data.matricule}</strong>, a validé les exigences du parcours
        <strong>${data.department}</strong> avec une promotion sur l'année
        <strong>${data.graduationYear}</strong>.
      </p>

      <div class="grid">
        <div class="card">
          <h2>Données académiques</h2>
          <span class="label">Étudiant</span>
          <div class="value">${data.studentName}</div>
          <span class="label">Département</span>
          <div class="value">${data.department}</div>
          <span class="label">Matricule</span>
          <div class="value mono">${data.matricule}</div>

          <table class="table">
            <thead>
              <tr>
                <th>Indicateur</th>
                <th>Résultat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>L1</td>
                <td>${formatAverage(data.l1Average)}</td>
              </tr>
              <tr>
                <td>L2</td>
                <td>${formatAverage(data.l2Average)}</td>
              </tr>
              <tr>
                <td>L3</td>
                <td>${formatAverage(data.l3Average)}</td>
              </tr>
              <tr>
                <td>PFE</td>
                <td>${formatNote(data.pfeNote)}</td>
              </tr>
              <tr>
                <td>Crédits validés</td>
                <td>${data.totalCredits} ECTS</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <h2>Validation institutionnelle</h2>
          <span class="label">Date d'émission</span>
          <div class="value">${issueDate}</div>
          <span class="label">Doyen</span>
          <div class="value">${shortenAddress(data.deanAddress)}</div>
          <div class="mono">${data.deanAddress}</div>
          <span class="label">Recteur</span>
          <div class="value">${shortenAddress(data.rectorAddress)}</div>
          <div class="mono">${data.rectorAddress}</div>
          <span class="label">CID IPFS (généré à la finalisation)</span>
          <div class="mono">à insérer après upload</div>
        </div>
      </div>

      <div class="signature-block">
        <div>
          <div class="signature-line">Signature du Doyen</div>
          <div class="mono">${data.deanAddress}</div>
        </div>
        <div>
          <div class="signature-line">Signature du Recteur</div>
          <div class="mono">${data.rectorAddress}</div>
        </div>
      </div>

      <div class="footer">
        <span>Généré automatiquement par DiploChain</span>
        <span>Batch #${data.batchId}</span>
      </div>
    </div>
  </body>
</html>`;
}

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
        top: "12mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
