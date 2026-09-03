import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const UNSUPPORTED_COLOR_RE = /lab\(|oklch\(|lch\(|color\(/;

const canvasCtx =
  typeof document !== "undefined"
    ? document.createElement("canvas").getContext("2d")
    : null;

function safeColor(value: string): string {
  if (!value || !UNSUPPORTED_COLOR_RE.test(value)) return value;
  try {
    if (canvasCtx) {
      canvasCtx.fillStyle = "#000000";
      canvasCtx.fillStyle = value;
      return canvasCtx.fillStyle;
    }
  } catch {
    /* fall through */
  }
  return "#000000";
}

function sanitizeColors(root: HTMLElement) {
  const els = root.querySelectorAll("*");
  els.forEach((elRaw) => {
    const el = elRaw as HTMLElement;
    const cs = window.getComputedStyle(el);
    const props = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "textDecorationColor",
      "fill",
      "stroke",
    ];
    props.forEach((p) => {
      const v = (cs as unknown as Record<string, string>)[p];
      if (v && UNSUPPORTED_COLOR_RE.test(v)) {
        (el.style as unknown as Record<string, string>)[p] = safeColor(v);
      }
    });
  });
}

/** Export HTML element content to high-quality PDF */
export async function exportToPdf(
  element: HTMLElement,
  filename = "document.pdf",
) {
  try {
    sanitizeColors(element);
    const canvas = await html2canvas(element, {
      scale: 4,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      ...({ letterRendering: true } as Record<string, unknown>),
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
    sanitizeColors(element);
    const canvas = await html2canvas(element, {
      scale: 4,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      ...({ letterRendering: true } as Record<string, unknown>),
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

const DOCUMENT_TYPE_CSS = `
  * { box-sizing: border-box; }
  h1, h2, h3, h4 {
    margin: 0 0 0.45em;
    color: #111827;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.02em;
  }
  h1, .doc-title { font-size: 22px; }
  h2 { font-size: 15px; }
  h3 { font-size: 13px; }
  p { margin: 0 0 0.85em; }
  .doc-meta {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 14px;
  }
  .doc-title { margin: 0 0 8px; }
  .doc-intro { color: #6b7280; font-size: 12.5px; line-height: 1.6; margin-bottom: 22px; }
  .section-title {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    border-bottom: 1px solid #111827;
    padding-bottom: 4px;
    margin: 28px 0 14px;
  }
  .doc-grid, .doc-block { display: block; margin: 0 0 22px; }
  .doc-grid-left { margin-bottom: 8px; }
  .doc-grid-right { margin: 0; }
  .sub-heading { font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 6px; }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    padding: 0 10px;
    margin: 0 6px 0 0;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #4b5563;
    background: #f9fafb;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    line-height: 20px;
    vertical-align: middle;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 4px 0 16px;
    font-size: 11.5px;
  }
  th, td {
    border: 1px solid #e5e7eb;
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
    line-height: 1.4;
  }
  th {
    background: #111827;
    color: #ffffff;
    font-weight: 600;
    border-color: #111827;
  }
  tr:nth-child(even) td { background: #f9fafb; }
  td:first-child { font-weight: 600; color: #111827; }
  ul, ol { margin: 0 0 12px; padding: 0 0 0 1.15rem; }
  ul { list-style: none; }
  ul li {
    position: relative;
    margin: 0 0 6px;
    padding-left: 0.2rem;
    line-height: 1.5;
  }
  ul li::before {
    content: "•";
    position: absolute;
    left: -0.95rem;
    top: 0;
    color: #111827;
    font-size: 14px;
    line-height: 1.5;
  }
  ol { padding-left: 1.35rem; }
  li > strong { font-weight: 700; color: #111827; }
  code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; }
  pre { background: #111827; color: #f9fafb; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 11px; }
  blockquote { border-left: 3px solid #d1d5db; margin: 0 0 12px; padding-left: 12px; color: #6b7280; }
  a { color: #2563eb; }
  img { max-width: 100%; height: auto; }
  strong { font-weight: 650; color: #111827; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
`;

/** Build a standalone HTML document string with safe (non-oklch) CSS for iframe rendering */
export function buildArtifactDocument(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  ${DOCUMENT_TYPE_CSS}
  html { font-size: 13px; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.55;
    color: #1f2937;
    background: #3f3f46;
    margin: 0;
    padding: 20px 12px 40px;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    width: min(794px, 100%);
    min-height: 1123px;
    margin: 0 auto 20px;
    background: #ffffff;
    padding: 52px 56px 64px;
    border-radius: 2px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.28);
    position: relative;
  }
  .page-badge {
    position: absolute;
    bottom: 18px;
    right: 18px;
    background: rgba(39,39,42,0.92);
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    padding: 5px 11px;
    border-radius: 999px;
    pointer-events: none;
  }
</style>
</head>
<body>
<div id="pages"></div>
<div id="measure" style="position:absolute;left:-9999px;top:0;width:682px;visibility:hidden;">
${content}
</div>
<script>
  (function() {
    var measure = document.getElementById('measure');
    var pagesContainer = document.getElementById('pages');
    var pageContentHeight = 1000;
    var children = Array.prototype.slice.call(measure.children);
    var buckets = [[]];
    var height = 0;

    function elHeight(el) {
      var style = window.getComputedStyle(el);
      var mt = parseFloat(style.marginTop) || 0;
      var mb = parseFloat(style.marginBottom) || 0;
      return el.offsetHeight + mt + mb;
    }

    children.forEach(function(child) {
      var h = elHeight(child);
      var last = buckets[buckets.length - 1];
      if (last.length && height + h > pageContentHeight) {
        buckets.push([]);
        height = 0;
        last = buckets[buckets.length - 1];
      }
      last.push(child);
      height += h;
    });

    if (!buckets[0].length) buckets[0].push(measure);
    var total = buckets.length;
    buckets.forEach(function(nodes, i) {
      var page = document.createElement('div');
      page.className = 'page';
      nodes.forEach(function(n) { page.appendChild(n); });
      var badge = document.createElement('div');
      badge.className = 'page-badge';
      badge.textContent = 'Page ' + (i + 1) + ' / ' + total;
      page.appendChild(badge);
      pagesContainer.appendChild(page);
    });
    measure.remove();
  })();
</script>
</body>
</html>`;
}

function buildPdfDocument(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  ${DOCUMENT_TYPE_CSS}
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.55;
    color: #1f2937;
    background: #ffffff;
    font-size: 13px;
  }
  .print-page {
    width: 794px;
    height: 1123px;
    padding: 52px 56px 64px;
    background: #ffffff;
    overflow: hidden;
    box-sizing: border-box;
  }
</style>
</head>
<body>
<div id="source">${content}</div>
</body>
</html>`;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

/** Render HTML string into a paginated A4 PDF Blob using an isolated iframe */
export async function renderHtmlToPdfBlob(html: string): Promise<Blob> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = `${A4_WIDTH_PX}px`;
  iframe.style.height = `${A4_HEIGHT_PX}px`;
  iframe.style.border = "0";
  iframe.srcdoc = buildPdfDocument(html);
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error("Failed to load iframe"));
      setTimeout(() => reject(new Error("Iframe load timeout")), 8000);
    });

    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) throw new Error("Cannot access iframe document");

    const source = iframeDoc.getElementById("source");
    if (!source) throw new Error("Missing source");

    const pageContentHeight = 1000;
    const children = Array.from(source.children);
    const buckets: Element[][] = [[]];
    let height = 0;

    const elHeight = (el: Element) => {
      const htmlEl = el as HTMLElement;
      const style = iframeDoc.defaultView?.getComputedStyle(htmlEl);
      const mt = parseFloat(style?.marginTop || "0") || 0;
      const mb = parseFloat(style?.marginBottom || "0") || 0;
      return htmlEl.offsetHeight + mt + mb;
    };

    for (const child of children) {
      const h = elHeight(child);
      const last = buckets[buckets.length - 1]!;
      if (last.length && height + h > pageContentHeight) {
        buckets.push([]);
        height = 0;
      }
      buckets[buckets.length - 1]!.push(child);
      height += h;
    }

    if (!buckets[0]?.length) {
      buckets[0] = [source];
    }

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();

    for (let p = 0; p < buckets.length; p++) {
      const pageDiv = iframeDoc.createElement("div");
      pageDiv.className = "print-page";
      for (const node of buckets[p]!) {
        pageDiv.appendChild(node.cloneNode(true));
      }
      iframeDoc.body.appendChild(pageDiv);

      const canvas = await html2canvas(pageDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        windowWidth: A4_WIDTH_PX,
        windowHeight: A4_HEIGHT_PX,
      });

      pageDiv.remove();

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (p > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, pageHeightMm);
    }

    source.remove();
    return pdf.output("blob");
  } finally {
    iframe.remove();
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
