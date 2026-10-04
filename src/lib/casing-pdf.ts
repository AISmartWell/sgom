export async function downloadCasingPdf(report: HTMLDivElement, name: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  pdf.setProperties({ title: `SGOM Casing Program — ${name} — DRAFT`, author: "AI Smart Well Inc." });
  const width = pdf.internal.pageSize.getWidth(), height = pdf.internal.pageSize.getHeight();
  const margin = 28, usableWidth = width - margin * 2, usableHeight = height - 76;
  const bg = getComputedStyle(report).backgroundColor;
  let y = margin;
  const pageBackground = () => { pdf.setFillColor(bg); pdf.rect(0, 0, width, height, "F"); };
  pageBackground();
  for (const block of Array.from(report.children)) {
    const canvas = await html2canvas(block as HTMLElement, { scale: 1.5, backgroundColor: bg, logging: false });
    const blockHeight = canvas.height * usableWidth / canvas.width;
    if (blockHeight <= usableHeight) {
      if (y + blockHeight > margin + usableHeight) { pdf.addPage(); pageBackground(); y = margin; }
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", margin, y, usableWidth, blockHeight);
      y += blockHeight + 12;
    } else {
      // Long free-text notes are sliced, never shrunk to unreadable text.
      if (y > margin) { pdf.addPage(); pageBackground(); }
      const sliceHeight = Math.floor(usableHeight * canvas.width / usableWidth);
      for (let offset = 0; offset < canvas.height; offset += sliceHeight) {
        if (offset > 0) { pdf.addPage(); pageBackground(); }
        const slice = document.createElement("canvas");
        slice.width = canvas.width; slice.height = Math.min(sliceHeight, canvas.height - offset);
        const context = slice.getContext("2d");
        if (!context) throw new Error("PDF image rendering is unavailable");
        context.drawImage(canvas, 0, offset, slice.width, slice.height, 0, 0, slice.width, slice.height);
        const h = slice.height * usableWidth / slice.width;
        pdf.addImage(slice.toDataURL("image/jpeg", 0.9), "JPEG", margin, margin, usableWidth, h);
        y = margin + h + 12;
      }
    }
  }
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(getComputedStyle(report).color);
    pdf.text(`SGOM | DRAFT - Not a field work order | ${i} / ${pages}`, margin, height - 18);
  }
  pdf.save(`SGOM_${name.replace(/[^a-z0-9_-]+/gi, "_")}_Casing_Program_DRAFT.pdf`);
}