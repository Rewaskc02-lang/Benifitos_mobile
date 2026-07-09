# Changelog

All notable changes to the BenefitOS project will be documented in this file.

## [1.0.2] - 2026-07-08

### Added
- Focus navigation listener to `RoadmapScreen` utilizing `@react-navigation/native` `useIsFocused` to automatically sync opportunities on tab navigation focus.
- System health checks for Sarvam AI model connectivity and environment configurations in backend `/health` endpoint.
- Process-wide crash monitoring hooks (`uncaughtException`, `unhandledRejection`) in backend Express server.

### Fixed
- Express startup server crashes due to port collisions (EADDRINUSE).
- Database connection lifecycle management pools hanging on server shutdown signals (`SIGINT`, `SIGTERM`).
- Document verification pipeline mask: frontend catch blocks re-structured to display real backend OCR validation response strings.
- Unified document state: document readiness queries fall back gracefully to standard required lists instead of locking at `0 of 0`.
- Session login stale data mismatch: automated recalculation triggers on `/login` and `/me` routes.

## [1.0.1] - 2026-07-08

### Added
- Real backend Tesseract.js OCR engine integration to extract text from document images uploaded from mobile clients.

### Fixed
- Purple security blocker: removed committed database master credentials file and updated `.gitignore` rules.
- Nested `<CameraView>` children runtime warning in document capturing layouts.
- TypeScript compilation error in `HomeScreen` readiness state fallback mapping.
