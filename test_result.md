# Testing Instructions

## Context
We have refactored the "New Consultation" page to use a tabbed interface with the following tabs:
1. ANAMNESE
2. EXAME FÍSICO
3. EXAMES
4. BIOIMPEDÂNCIA
5. ESCORES
6. PRESCRIÇÃO

We also attempted to fix a navigation bug in the Patients List page where clicking a patient would redirect to dashboard instead of profile.

## Objectives
1. **Verify Consultation Tabs:**
   - Go to `/consultas/nova` (or start a new consultation).
   - Verify that the tabs listed above are present.
   - Click on each tab and verify content loads (e.g., text areas for SOAP, tables for Exams/Bioimpedance).

2. **Verify Navigation Bug Fix:**
   - Go to `/pacientes`.
   - Click on a patient row.
   - Verify that the URL changes to `/pacientes/:id` and the profile page loads.
   - Ensure it does NOT redirect to `/` (dashboard).

3. **Verify Autosave (Optional):**
   - Type in "Anamnese" text area.
   - Wait a few seconds.
   - Check if "Salvo" indicator appears (mocked or real).

## Notes
- Use the credentials `rafaellarar65@gmail.com` / `12345678` for login.
- The backend is running.
