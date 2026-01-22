
import { generateSiddurPDF, SiddurFormat } from '../lib/siddur-pdf-utils/ashkenaz/siddurMainFile';
import * as fs from 'fs';
import * as path from 'path';

async function generateDevPDF() {
    try {
        console.log('Generating Dev PDF...');
        
        const params = {
            selectedDate: new Date().toISOString(),
            siddurFormat: SiddurFormat.NusachAshkenaz,
            userName: 'Dev User',
            style: 'Recommended',
            pageMargins: 'normal' as const,
            printBlackAndWhite: false,
        };

        const pdfBytes = await generateSiddurPDF(params);
        
        const outputPath = path.join(process.cwd(), 'dev-siddur.pdf');
        fs.writeFileSync(outputPath, pdfBytes);
        
        console.log(`✅ PDF generated successfully at: ${outputPath}`);
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        process.exit(1);
    }
}

generateDevPDF();
