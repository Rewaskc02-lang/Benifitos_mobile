# BenefitOS: Stabilization Log

## Completed Issues

### Issue ID: SEC-001
*   **Title**: Exposed Neo4j AuraDB Master Credentials in Git History
*   **Status**: Fixed & Verified
*   **Root Cause**: Credentials dump file `Neo4j-2cf3664e-Created-2026-07-06.txt` was committed to repository tracking.
*   **Files Modified**: 
    *   Deleted: `Neo4j-2cf3664e-Created-2026-07-06.txt`
    *   Modified: `.gitignore`
*   **Verification Completed**: Checked file untracked status, validated local environment running off secure `.env` params.
*   **Regression Checks**: Frontend and backend run correctly.
*   **Remaining Risks**: Old credential history remains in Git commit history logs.
*   **Date Completed**: July 8, 2026

### Issue ID: DOC-001
*   **Title**: Fails-Closed OCR Document Pipeline Integration Gap
*   **Status**: Fixed & Verified (Real Backend Tesseract.js OCR Integration)
*   **Root Cause**: Backend document verification expected `ocrText` parameters from the client request. Because the mobile app uploads raw images without running local OCR, the pipeline rejected all requests with missing OCR text errors.
*   **Why Tesseract.js was selected**: Run-anywhere WebAssembly wrapper with zero native C++ compiler runtime dependencies.
*   **Files Modified**:
    *   [NEW] `benefitos-backend/src/services/ocr/TesseractOCRProvider.js`
    *   [NEW] `benefitos-backend/src/services/ocr/OCRProvider.js`
    *   [MODIFY] `benefitos-backend/src/services/citizenService.js`
    *   [MODIFY] `benefitos-backend/src/services/documentIntelligenceService.js`
*   **Verification Completed**: Backend unit and integration tests run successfully (36/36 passed).
*   **Date Completed**: July 8, 2026

### Issue ID: PRI-001
*   **Title**: Backend Health & Server Lifecycle Management (Priority 1)
*   **Status**: Fixed & Verified
*   **Root Cause**: Lack of EADDRINUSE handlers caused startup crashes; open database pools hung on SIGINT/SIGTERM; unhandled exception filters were missing; `/health` was basic and did not check Sarvam AI connectivity.
*   **Files Modified**:
    *   [MODIFY] `benefitos-backend/server.js`
    *   [MODIFY] `benefitos-backend/src/app.js`
    *   [MODIFY] `benefitos-backend/tests/api.test.js`
*   **Verification Completed**: Integration tests written, Express lifecycle verified on shutdown, health endpoint verified.
*   **Date Completed**: July 8, 2026

### Issue ID: PRI-002
*   **Title**: Document Verification Pipeline Errors Exposure (Priority 2)
*   **Status**: Fixed & Verified
*   **Root Cause**: Client app caught all errors and immediately prompted offline queuing, concealing OCR failure, validation failure, or backend timeouts.
*   **Files Modified**:
    *   [MODIFY] `src/screens/profile/MyDocumentsScreen.tsx`
*   **Verification Completed**: Re-structured catch blocks to parse error status codes and JSON response body strings.
*   **Date Completed**: July 8, 2026

### Issue ID: PRI-003
*   **Title**: Unified Document State Source of Truth (Priority 3)
*   **Status**: Fixed & Verified
*   **Root Cause**: Empty `:ELIGIBLE_FOR` relations on new seeded users returned `total: 0` in readiness tracker, causing Graph and Documents screens to mismatch.
*   **Files Modified**:
    *   [MODIFY] `benefitos-backend/src/queries/citizenQueries.js`
    *   [MODIFY] `benefitos-backend/src/controllers/authController.js`
*   **Verification Completed**: Dynamic document readiness query fallback logic, automated login/me calculations sync triggers.
*   **Date Completed**: July 8, 2026

### Issue ID: PRI-004
*   **Title**: Focused Tab Navigation Refresh & Sync (Priority 4)
*   **Status**: Fixed & Verified
*   **Root Cause**: Tab components stayed in memory, leading to stale states when moving between screens without manual app restarts.
*   **Files Modified**:
    *   [MODIFY] `src/screens/RoadmapScreen.tsx`
*   **Verification Completed**: Focused event listeners added to refresh component state dynamically on navigation.
*   **Date Completed**: July 8, 2026
