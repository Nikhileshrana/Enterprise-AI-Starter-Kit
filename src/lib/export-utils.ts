import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/** Export HTML element content to high-quality PDF */
export async function exportToPdf(
  element: HTMLElement,
  filename = "document.pdf",
) {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw error;
  }
}

/** Export HTML element content to PNG Image */
export async function exportToPng(
  element: HTMLElement,
  filename = "document.png",
) {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("PNG Export Error:", error);
    throw error;
  }
}

/** Download standalone HTML file */
export function exportToHtml(content: string, filename = "document.html") {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace(/\.html$/, "")}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      background-color: #ffffff;
    }
    h1, h2, h3, h4 { margin-top: 1.5em; margin-bottom: 0.5em; color: #111; }
    p { margin-bottom: 1em; }
    code { background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #1e1e2e; color: #f8f8f2; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #0066cc; margin: 0; padding-left: 16px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f5; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  link.click();
  URL.revokeObjectURL(url);
}
