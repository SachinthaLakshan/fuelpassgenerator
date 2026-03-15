"use client";

import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

const FUEL_TYPES = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
] as const;

const RED = "#C41E3A";

/** Parse OCR text for vehicle number (e.g. "CBE - 5684") and code (e.g. "CODE: 5FAJDYA568522"). */
function parseOcrText(text: string): { vehicleNumber: string; code: string } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let vehicleNumber = "";
  let code = "";

  for (const line of lines) {
    // Vehicle: 2–4 letters, optional space/dash, 4–5 digits (e.g. CBE - 5684, CBE-5684)
    const vehicleMatch = line.match(/^([A-Z]{2,4})\s*[-–—]?\s*(\d{4,5})$/i);
    if (vehicleMatch && !vehicleNumber) {
      vehicleNumber = `${vehicleMatch[1].toUpperCase()} - ${vehicleMatch[2]}`;
      continue;
    }
    // Code: line starting with "CODE:" or long alphanumeric
    if (line.toUpperCase().startsWith("CODE:")) {
      code = line.replace(/^CODE:\s*/i, "").trim();
    } else if (/^[A-Z0-9]{10,20}$/i.test(line) && !code) {
      code = line;
    }
  }

  return { vehicleNumber, code };
}

export default function Home() {
  const [fuelType, setFuelType] = useState<string>("PETROL");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [code, setCode] = useState("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "done">("idle");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQrChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setOcrStatus("idle");
    setVehicleNumber("");
    setCode("");
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file (PNG, JPG, etc.)");
        return;
      }
      setQrFile(file);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setQrPreview(dataUrl);

      setOcrStatus("loading");
      try {
        const Tesseract = await import("tesseract.js");
        const { data } = await Tesseract.recognize(dataUrl, "eng", {
          logger: () => {},
        });
        const { vehicleNumber: v, code: c } = parseOcrText(data.text);
        setVehicleNumber(v);
        setCode(c);
        setOcrStatus("done");
      } catch {
        setOcrStatus("done");
      }
    } else {
      setQrFile(null);
      setQrPreview(null);
    }
  };

  const generatePdf = async () => {
    if (!qrFile && !qrPreview) {
      setError("Please upload a QR code image.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: [54, 86],
        hotfixes: ["pxScale"],
      });
      const w = 54;
      const h = 86;

      // Red background
      doc.setFillColor(RED);
      doc.rect(0, 0, w, h, "F");

      // Title (increased size)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("NATIONAL FUEL PASS", w / 2, 9, { align: "center" });
      doc.setFontSize(6);

      // White rounded panel (QR area)
      const panelX = 4;
      const panelY = 16;
      const panelW = w - 8;
      const panelH = 42;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(panelX, panelY, panelW, panelH, 2, 2, "F");

      // QR code image only (centered in panel)
      const qrSize = 40;
      const qrX = (w - qrSize) / 2;
      const qrY = panelY + (panelH - qrSize) / 2;
      if (qrPreview) {
        const imgFormat = qrPreview.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
        doc.addImage(qrPreview, imgFormat, qrX, qrY, qrSize, qrSize);
      }

      // Bottom bar: fuel type (left) + vehicle number (right), attractive split design
      const footerH = 18;
      const footerTop = h - footerH;
      const centerX = w / 2;
      const barMidY = footerTop + footerH / 2;

      // Dark bar (no bottom border radius — square corners)
      doc.setFillColor(28, 28, 32);
      doc.rect(0, footerTop, w, footerH, "F");

      // Red accent line down the center
      doc.setDrawColor(196, 30, 58);
      doc.setLineWidth(0.6);
      doc.line(centerX, footerTop + 2, centerX, h - 2);

      // Left: fuel type
      const leftCenter = centerX / 2;
      doc.setTextColor(180, 180, 185);
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.text("FUEL TYPE", leftCenter, barMidY - 2.5, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(fuelType, leftCenter, barMidY + 3, { align: "center" });

      // Right: vehicle number
      const rightCenter = centerX + centerX / 2;
      const vehicleDisplay = vehicleNumber || "—";
      doc.setTextColor(180, 180, 185);
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.text("VEHICLE", rightCenter, barMidY - 2.5, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(vehicleDisplay, rightCenter, barMidY + 3, { align: "center" });

      // Subtle top edge highlight (thin line)
      doc.setDrawColor(60, 60, 65);
      doc.setLineWidth(0.2);
      doc.line(2, footerTop + 0.5, w - 2, footerTop + 0.5);

      doc.save("national-fuel-pass.pdf");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Banner - QR Code Generator link4 */}
      <header className="bg-[#C41E3A] text-white shadow-md">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold text-sm sm:text-base">
            National Fuel Pass Generator
          </span>
          <a
            href="https://fuelpass.gov.lk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-2 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Generate QR Code
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="rounded-2xl bg-white shadow-lg border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-800">Create Fuel Pass</h1>
            <p className="text-sm text-slate-500 mt-1">
              Select fuel type and upload your QR code image (with vehicle number and code) to download a printable PDF.
            </p>
          </div>

          <form
            className="p-6 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              generatePdf();
            }}
          >
            {/* Fuel type */}
            <div>
              <label htmlFor="fuelType" className="block text-sm font-medium text-slate-700 mb-2">
                Fuel type
              </label>
              <select
                id="fuelType"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 shadow-sm focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/20"
              >
                {FUEL_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* QR code image */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                QR code image
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:border-[#C41E3A] hover:bg-[#C41E3A]/5 hover:text-[#C41E3A] transition-colors"
                >
                  {qrFile ? qrFile.name : "Choose image"}
                </button>
                {qrPreview && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={qrPreview}
                      alt="QR preview"
                      className="h-20 w-20 object-contain"
                    />
                  </div>
                )}
              </div>
              {ocrStatus === "loading" && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  Detecting vehicle number and code…
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1.5">
                Upload an image; vehicle number and code are auto-filled from the image. You can edit below if needed.
              </p>
            </div>

            {/* Auto-populated vehicle number & code (editable) */}
            {(vehicleNumber || code || ocrStatus === "done") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-slate-50 border border-slate-200 p-4">
                <div>
                  <label htmlFor="vehicleNumber" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Vehicle number
                    {ocrStatus === "done" && (vehicleNumber || code) && (
                      <span className="ml-1.5 text-xs font-normal text-emerald-600">(from image)</span>
                    )}
                  </label>
                  <input
                    id="vehicleNumber"
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. CBE - 5684"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 text-sm focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/20"
                  />
                </div>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Code
                    {ocrStatus === "done" && code && (
                      <span className="ml-1.5 text-xs font-normal text-emerald-600">(from image)</span>
                    )}
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. 5FAJDYA568522"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 text-sm focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/20"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={generating || !qrPreview}
                className="w-full rounded-lg bg-[#C41E3A] text-white font-semibold py-3.5 px-4 hover:bg-[#9e1830] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {generating ? "Generating…" : "Generate & download PDF"}
              </button>
            </div>
          </form>
        </div>

        <footer className="mt-8 py-4 text-center text-xs text-slate-500">
          PDF size: 54 × 86 mm (portrait). No data is sent to any server.
        </footer>
      </main>
    </div>
  );
}
