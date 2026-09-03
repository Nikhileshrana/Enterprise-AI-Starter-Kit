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

/** Build a standalone HTML document string with safe (non-oklch) CSS for iframe rendering */
export function buildArtifactDocument(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  html { font-size: 12px; }
  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.55;
    color: #3f3f46;
    background: #27272a;
    padding: 24px 16px 48px;
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    width: 794px;
    max-width: 100%;
    height: 1123px;
    margin: 0 auto 20px;
    background: #ffffff;
    padding: 56px 64px;
    border-radius: 2px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.18);
    overflow: hidden;
    position: relative;
  }

  /* Per-page badge */
  .page-badge {
    position: absolute;
    bottom: 16px;
    right: 16px;
    z-index: 10;
    background: rgba(39,39,42,0.92);
    color: #ffffff;
    font-size: 0.68rem;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    pointer-events: none;
    user-select: none;
  }

  /* Top meta row: REPORT label + date */
  .doc-meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #a1a1aa;
    margin-bottom: 1.2em;
  }

  /* Main title */
  .doc-title {
    font-size: 1.85rem;
    font-weight: 700;
    color: #0a0a0a;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin: 0 0 0.6em 0;
  }

  /* Intro paragraph */
  .doc-intro {
    color: #71717a;
    font-size: 0.92rem;
    line-height: 1.6;
    margin-bottom: 2.5em;
    max-width: 95%;
  }

  /* Section header with underline */
  .section-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0a0a0a;
    display: inline-block;
    border-bottom: 1px solid #0a0a0a;
    padding-bottom: 2px;
    margin: 2.5em 0 1.2em 0;
  }

  /* Two-column layout for sub-sections */
  .doc-grid {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 2.5em;
    margin-bottom: 2em;
  }

  /* Left column: sub-heading + badges */
  .doc-grid-left { padding-top: 0.2em; }
  .sub-heading {
    font-size: 0.95rem;
    font-weight: 700;
    color: #0a0a0a;
    margin-bottom: 0.6em;
  }
  .badge {
    display: inline-block;
    box-sizing: border-box;
    height: 22px;
    line-height: 22px;
    padding: 0 11px;
    margin: 0 6px 6px 0;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #3f3f46;
    border: 1px solid #c4c4c8;
    border-radius: 11px;
    vertical-align: middle;
    white-space: nowrap;
  }

  /* Right column: body content */
  .doc-grid-right p { margin-bottom: 0.7em; }
  .doc-grid-right p:first-child strong { color: #0a0a0a; }

  /* Standard elements */
  h1, h2, h3, h4 { margin-top: 1.4em; margin-bottom: 0.5em; color: #0a0a0a; font-weight: 700; line-height: 1.3; }
  h1 { font-size: 1.85em; letter-spacing: -0.02em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.1em; }
  p { margin-bottom: 0.8em; }
  table { width: 100%; border-collapse: collapse; margin: 1.2em 0; font-size: 0.88em; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; }
  th { background: #1e293b; color: #ffffff; font-weight: 600; padding: 10px 14px; text-align: left; border: none; font-size: 0.92em; letter-spacing: 0.01em; }
  td { padding: 10px 14px; text-align: left; border: none; border-bottom: 1px solid #e2e8f0; vertical-align: middle; line-height: 1.45; }
  tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  tbody tr:hover td { background: #f1f5f9; }
  td:first-child { font-weight: 600; color: #0f172a; }
  ul { list-style-type: disc; list-style-position: outside; padding-left: 1.5em; margin-bottom: 0.8em; }
  ol { list-style-type: decimal; list-style-position: outside; padding-left: 1.8em; margin-bottom: 0.8em; }
  li { margin-bottom: 0.4em; line-height: 1.5; }
  li > strong { font-weight: 700; }
  code { background: #f4f4f5; padding: 1px 5px; border-radius: 3px; font-family: ui-monospace, "SF Mono", monospace; font-size: 0.85em; }
  pre { background: #18181b; color: #f4f4f5; padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 0.82em; }
  blockquote { border-left: 3px solid #d4d4d8; margin: 0 0 0.8em 0; padding-left: 14px; color: #71717a; }
  a { color: #2563eb; text-decoration: underline; }
  img { max-width: 100%; height: auto; }
  strong { font-weight: 600; color: #0a0a0a; }
  hr { border: none; border-top: 1px solid #e4e4e7; margin: 1.8em 0; }
</style>
</head>
<body>
<div id="pages"></div>
<div id="measure" style="position:absolute;left:-9999px;top:0;width:666px;padding:0;margin:0;visibility:hidden;">
${content}
</div>
<script>
  (function() {
    var measure = document.getElementById('measure');
    var pagesContainer = document.getElementById('pages');
    var pageContentHeight = 1011; // 1123 - 56*2 padding

    function createPage(num, total) {
      var page = document.createElement('div');
      page.className = 'page';
      var badge = document.createElement('div');
      badge.className = 'page-badge';
      badge.textContent = 'Page ' + num + ' / ' + total;
      page.appendChild(badge);
      return page;
    }

    function paginate() {
      var children = Array.prototype.slice.call(measure.childNodes);
      var pages = [];
      var current = null;
      var currentHeight = 0;

      function newPage() {
        current = document.createElement('div');
        current.style.padding = '0';
        current.style.margin = '0';
        currentHeight = 0;
        pages.push(current);
      }

      newPage();

      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.nodeType === 3) {
          if (!child.textContent.trim()) continue;
          var span = document.createElement('span');
          span.style.display = 'block';
          span.textContent = child.textContent;
          child = span;
        }
        var h = child.offsetHeight || 0;
        if (h === 0) continue;

        if (currentHeight + h > pageContentHeight && currentHeight > 0) {
          newPage();
        }
        current.appendChild(child);
        currentHeight += h;
      }

      var total = pages.length;
      for (var p = 0; p < total; p++) {
        var page = createPage(p + 1, total);
        var content = pages[p];
        // Insert content before badge
        page.insertBefore(content, page.firstChild);
        pagesContainer.appendChild(page);
      }
    }

    paginate();
    measure.remove();
  })();
</script>
</body>
</html>`;
}

/** Build a simple isolated HTML document for PDF rendering (no scripts, safe CSS only) */
function buildPdfDocument(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.55;
    color: #18181b;
    background: #ffffff;
    padding: 56px 64px;
    margin: 0;
    font-size: 13px;
  }
  h1,h2,h3,h4 { margin-top: 1.4em; margin-bottom: 0.5em; color: #0a0a0a; font-weight: 700; line-height: 1.3; }
  h1 { font-size: 1.85em; letter-spacing: -0.02em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.1em; }
  p { margin-bottom: 0.8em; }
  table { width: 100%; border-collapse: collapse; margin: 1.2em 0; font-size: 0.88em; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; }
  th { background: #1e293b; color: #ffffff; font-weight: 600; padding: 10px 14px; text-align: left; border: none; font-size: 0.92em; letter-spacing: 0.01em; }
  td { padding: 10px 14px; text-align: left; border: none; border-bottom: 1px solid #e2e8f0; vertical-align: middle; line-height: 1.45; }
  tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  tbody tr:hover td { background: #f1f5f9; }
  td:first-child { font-weight: 600; color: #0f172a; }
  ul { list-style-type: disc; list-style-position: outside; padding-left: 1.5em; margin-bottom: 0.8em; }
  ol { list-style-type: decimal; list-style-position: outside; padding-left: 1.8em; margin-bottom: 0.8em; }
  li { margin-bottom: 0.4em; line-height: 1.5; }
  li > strong { font-weight: 700; }
  code { background: #f4f4f5; padding: 1px 5px; border-radius: 3px; font-family: ui-monospace, monospace; font-size: 0.85em; }
  pre { background: #18181b; color: #f4f4f5; padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 0.82em; }
  blockquote { border-left: 3px solid #d4d4d8; margin: 0 0 0.8em 0; padding-left: 14px; color: #71717a; }
  a { color: #2563eb; text-decoration: underline; }
  img { max-width: 100%; height: auto; }
  strong { font-weight: 600; color: #0a0a0a; }
  hr { border: none; border-top: 1px solid #e4e4e7; margin: 1.8em 0; }
  .doc-meta { display: flex; justify-content: space-between; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #a1a1aa; margin-bottom: 1.2em; }
  .doc-title { font-size: 1.85rem; font-weight: 700; color: #0a0a0a; letter-spacing: -0.02em; margin: 0 0 0.6em 0; }
  .doc-intro { color: #71717a; font-size: 0.92rem; margin-bottom: 2.5em; }
  .section-title { font-size: 1.05rem; font-weight: 700; color: #0a0a0a; display: inline-block; border-bottom: 1px solid #0a0a0a; padding-bottom: 2px; margin: 2.5em 0 1.2em 0; }
  .doc-grid { display: grid; grid-template-columns: 200px 1fr; gap: 2.5em; margin-bottom: 2em; }
  .sub-heading { font-size: 0.95rem; font-weight: 700; color: #0a0a0a; margin-bottom: 0.6em; }
  .badge { display: inline-block; box-sizing: border-box; height: 22px; line-height: 22px; padding: 0 11px; margin: 0 6px 6px 0; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #3f3f46; border: 1px solid #c4c4c8; border-radius: 11px; vertical-align: middle; white-space: nowrap; }
</style>
</head>
<body>
${content}
</body>
</html>`;
}

/** Render HTML string into a paginated A4 PDF Blob using an isolated iframe */
export async function renderHtmlToPdfBlob(html: string): Promise<Blob> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "794px";
  iframe.style.height = "1200px";
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
    if (!iframeDoc || !iframe.contentWindow) {
      throw new Error("Cannot access iframe document");
    }

    const target = iframeDoc.body;

    // Element-boundary pagination: group child elements into A4 pages
    const pageContentHeight = 1011; // 1123px A4 - 56*2 padding
    const children = Array.from(target.childNodes);

    // Group elements into pages
    const pages: Node[][] = [];
    let currentPage: Node[] = [];
    let currentHeight = 0;

    for (const child of children) {
      // Skip empty text nodes
      if (child.nodeType === 3) {
        if (!child.textContent?.trim()) continue;
        // Wrap text nodes in a span
        const span = iframeDoc.createElement("span");
        span.style.display = "block";
        span.textContent = child.textContent;
        child.parentNode?.replaceChild(span, child);
        currentPage.push(span);
        currentHeight += span.offsetHeight || 0;
        continue;
      }

      if (child.nodeType !== 1) continue;
      const el = child as HTMLElement;
      const elHeight = el.offsetHeight || 0;
      if (elHeight === 0) continue;

      // If element alone is taller than a page, put it on its own page
      if (elHeight > pageContentHeight && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }

      // If adding this element exceeds page height, start new page
      if (currentHeight + elHeight > pageContentHeight && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }

      currentPage.push(child);
      currentHeight += elHeight;
    }

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    // Fallback: if no pages (empty content), render whole body
    if (pages.length === 0) {
      pages.push(Array.from(target.childNodes));
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();

    for (let p = 0; p < pages.length; p++) {
      // Create a temporary container for this page's elements
      const pageDiv = iframeDoc.createElement("div");
      pageDiv.style.cssText =
        "padding:56px 64px;background:#ffffff;width:794px;box-sizing:border-box;";
      for (const node of pages[p]) {
        if (node.nodeType === 1) {
          pageDiv.appendChild(node.cloneNode(true));
        }
      }
      target.appendChild(pageDiv);

      const canvas = await html2canvas(pageDiv, {
        scale: 4,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        ...({ letterRendering: true } as Record<string, unknown>),
        windowWidth: 794,
        windowHeight: pageDiv.offsetHeight,
      });

      pageDiv.remove();

      const imgData = canvas.toDataURL("image/png");
      if (p > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm);
    }

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
