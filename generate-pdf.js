#!/usr/bin/env node
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts one or multiple HTML files to PDFs using Puppeteer.
 * Usage examples:
 *    node generate-pdf.js resume.html
 *    node generate-pdf.js ./templates/
 *    npm run pdf -- ./templates/resume1.html
 */

async function generatePDF(filePath, browser) {
  const page = await browser.newPage();
  const fileUrl = `file://${filePath}`;
  console.log(`Processing: ${filePath}`);

  // Ensure the "converted" folder exists
  const outputDir = path.join(__dirname, "converted");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Build the destination PDF path inside "converted"
  const pdfFileName = path.basename(filePath).replace(/\.html?$/, ".pdf");
  const pdfPath = path.join(outputDir, pdfFileName);

  console.log(`Generating PDF for: ${path.basename(filePath)}`);

  await page.goto(fileUrl, { waitUntil: "networkidle0" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "8mm", right: "10mm", bottom: "8mm", left: "10mm" },
  });

  await page.close();
  console.log(` Created: ${pdfPath}\n`);
}

async function main() {
  const inputArg = process.argv[2]; // path or file passed via CLI
  if (!inputArg) {
    console.error("Usage: node generate-pdf.js <file.html | folder>");
    process.exit(1);
  }

  const inputPath = path.resolve(__dirname, inputArg);

  // Validate input path
  if (!fs.existsSync(inputPath)) {
    console.error(`File or directory not found: ${inputPath}`);
    process.exit(1);
  }

  const browser = await puppeteer.launch();

  if (fs.lstatSync(inputPath).isDirectory()) {
    const files = fs.readdirSync(inputPath)
      .filter(f => f.endsWith(".html"))
      .map(f => path.join(inputPath, f));

    if (files.length === 0) {
      console.log("No HTML files found in folder.");
    } else {
      for (const file of files) {
        await generatePDF(file, browser);
      }
    }
  } else if (inputPath.endsWith(".html")) {
    await generatePDF(inputPath, browser);
  } else {
    console.log("Please provide an HTML file or a folder containing .html files.");
  }

  await browser.close();
  console.log("All done!");
}

main().catch(err => {
  console.error("Error during PDF generation:", err);
  process.exit(1);
});
