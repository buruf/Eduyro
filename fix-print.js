const fs = require('fs');
const f = 'src/app/print/[childId]/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Replace the @page and sheet-page print CSS with a zoom-based approach
const oldCSS = `        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Hide everything except sheets */
          .no-print {
            display: none !important;
          }

          /* Each sheet fills exactly one page */
          .sheet-page {
            width: 8.5in;
            height: 11in;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }

          /* The inner content scales down to fit */
          .sheet-inner {
            width: 100%;
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          /* Shrink font sizes slightly for dense sheets */
          .sheet-page .problem-text {
            font-size: 11pt;
            line-height: 1.3;
          }

          .sheet-page .problem-row {
            padding-top: 2pt;
            padding-bottom: 2pt;
          }
        }`;

const newCSS = `        @media print {
          @page {
            size: letter portrait;
            margin: 0.4in 0.5in;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          /* Force each sheet onto exactly one page using zoom */
          .sheet-page {
            page-break-after: always;
            break-after: page;
            box-sizing: border-box;
            /* zoom shrinks the entire sheet to fit within the page */
            zoom: 0.75;
            -webkit-print-color-adjust: exact;
          }

          /* Remove screen shadow/bg on print */
          .sheet-page {
            box-shadow: none !important;
            background: white !important;
            margin: 0 !important;
            padding: 0.3in 0.4in !important;
            width: 100% !important;
            min-height: unset !important;
          }
        }`;

if (!c.includes(oldCSS)) {
  console.log('❌ CSS block not found exactly — writing targeted replacement');
  // fallback: replace just the @page rule
  c = c.replace(
    `          @page {
            size: letter portrait;
            margin: 0;
          }`,
    `          @page {
            size: letter portrait;
            margin: 0.4in 0.5in;
          }`
  );
  // Add zoom to sheet-page
  c = c.replace(
    `          /* Each sheet fills exactly one page */
          .sheet-page {
            width: 8.5in;
            height: 11in;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }`,
    `          .sheet-page {
            page-break-after: always;
            break-after: page;
            box-sizing: border-box;
            zoom: 0.75;
            box-shadow: none !important;
            background: white !important;
            margin: 0 !important;
            padding: 0.3in 0.4in !important;
            width: 100% !important;
            min-height: unset !important;
          }`
  );
} else {
  c = c.replace(oldCSS, newCSS);
}

fs.writeFileSync(f, c);
console.log('Done — zoom: 0.75 applied on print');
