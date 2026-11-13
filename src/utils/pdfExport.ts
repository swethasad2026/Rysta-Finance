import html2pdf from 'html2pdf.js';

/**
 * Captures the exact DOM element with all charts, cards, colors, and layout,
 * and compiles it directly into a high-resolution .pdf file saved to the user's downloads folder.
 */
export async function exportVisualReportToPdf(
  elementId: string = 'visual-report-printable',
  filename: string = `AI_Financial_Analyst_Report_${new Date().toISOString().split('T')[0]}.pdf`
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[PDF Export] Element #${elementId} not found, launching window.print()`);
    window.print();
    return false;
  }

  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? '#0f172a' : '#ffffff';

  const opt: any = {
    margin: [6, 6, 6, 6],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      windowWidth: document.documentElement.offsetWidth || 1280,
      backgroundColor: bgColor,
      ignoreElements: (el: Element) => {
        return (
          el.getAttribute('data-html2canvas-ignore') === 'true' ||
          el.getAttribute('data-print-hide') === 'true' ||
          el.classList.contains('print:hidden') ||
          el.tagName.toLowerCase() === 'button'
        );
      },
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    console.log(`[PDF Export] Generating visual PDF for #${elementId}...`);
    await html2pdf().set(opt).from(element).save();
    console.log('[PDF Export] Visual PDF generated and downloaded successfully!');
    return true;
  } catch (err) {
    console.warn('[PDF Export] Direct PDF render encountered error, falling back to window.print():', err);
    window.print();
    return false;
  }
}
