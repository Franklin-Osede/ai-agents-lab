// Quick test to verify footer hours extraction
const testFooterExtraction = () => {
  // footerHTML is not used
  // const footerHTML = \`
  //   <footer>
  //     <p>Horario: L-V 9:00-20:00</p>
  //     <p>Teléfono: +34 645 39 40 92</p>
  //   </footer>
  // \`;

  const footerText = 'Horario: L-V 9:00-20:00\nTeléfono: +34 645 39 40 92';

  const hoursPatterns = [
    /(?:L-V|Lunes?\s*-?\s*Viernes?|Monday?\s*-?\s*Friday?)[\s:]*(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/i,
    /Horario[\s:]+([^\n]{10,80})/i,
    /(?:Abierto|Open)[\s:]+([^\n]{10,80})/i,
    /(?:L|Lunes|Monday)[\s-]+(?:V|Viernes|Friday)[\s:]+\d{1,2}:\d{2}[\s-]+\d{1,2}:\d{2}/i,
  ];

  for (const pattern of hoursPatterns) {
    const match = footerText.match(pattern);
    if (match) {
      console.log('✅ Pattern matched:', pattern);
      console.log('✅ Extracted hours:', match[0].trim());
      return match[0].trim();
    }
  }

  console.log('❌ No pattern matched');
  return '';
};

console.log('Testing footer extraction...');
const result = testFooterExtraction();
console.log('Final result:', result);
