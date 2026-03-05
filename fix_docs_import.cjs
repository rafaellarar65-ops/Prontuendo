const fs = require('fs');

let content = fs.readFileSync('src/pages/patient-profile-page.tsx', 'utf8');
content = content.replace(/import type \{ DocumentCategory \} from '@\/types\/documents';/g, "import type { DocumentCategory } from '@/types/clinical-modules';");
content = content.replace(/PatientDocument/g, "Document");
fs.writeFileSync('src/pages/patient-profile-page.tsx', content);

let apiContent = fs.readFileSync('src/lib/api/patient-portal-api.ts', 'utf8');
apiContent = apiContent.replace(/import type \{ PatientDocument, UploadDocumentDto \} from '@\/types\/documents';/g, "import type { PatientDocument, UploadDocumentDto } from '@/types/clinical-modules';");
apiContent = apiContent.replace(/listByPatient/g, "list");
fs.writeFileSync('src/lib/api/patient-portal-api.ts', apiContent);
