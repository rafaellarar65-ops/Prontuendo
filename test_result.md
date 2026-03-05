# Testing Instructions

## Context
We have implemented two main features:
1. **AI Lab Report Analysis:** An "Upload & Analyze" feature in the "Exames" tab of the Consultation screen. It uses Gemini to extract data from an image/PDF.
2. **Consultation Navigation Fix:** Verified that "Nova Receita" and "Novo Laudo" buttons work.

## Objectives
1. **Verify AI Lab Analysis:**
   - Go to `/consultas/nova` (or start a new consultation).
   - Go to the **EXAMES** tab.
   - Click "Adicionar exame".
   - Click "Preencher com IA" (sparkles icon).
   - Upload a sample lab report (image or PDF).
   - Verify that the form fields (Name, Value, Unit, Reference, Date) are pre-filled.
   - Save the exam.

2. **Verify Nova Receita / Novo Laudo:**
   - Go to `/consultas/nova`.
   - Click "Nova Receita" in the right sidebar.
   - Verify navigation to `/prescricoes` with the modal open.
   - Go back.
   - Click "Novo Laudo".
   - Verify navigation to `/templates`.

## Notes
- Use `rafaellarar65@gmail.com` / `12345678`.
- For AI testing, you need a valid `GEMINI_API_KEY` in the backend environment. If not present, the button will fail or log a warning.
