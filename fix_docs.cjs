const fs = require('fs');

// restore the imported types
let pageContent = fs.readFileSync('src/pages/patient-profile-page.tsx', 'utf8');
pageContent = pageContent.replace(/import type \{ DocumentCategory \} from '@\/types\/documents';/, "import type { DocumentCategory } from '@/types/clinical-modules';");
pageContent = pageContent.replace(/PatientDocument/g, "Document");

fs.writeFileSync('src/pages/patient-profile-page.tsx', pageContent);

let apiContent = fs.readFileSync('src/lib/api/documents-api.ts', 'utf8');
apiContent = apiContent.replace(/import type \{ PatientDocument, UploadDocumentDto \} from '@\/types\/documents';/, "import type { PatientDocument, UploadDocumentDto } from '@/types/clinical-modules';");

fs.writeFileSync('src/lib/api/documents-api.ts', apiContent);
