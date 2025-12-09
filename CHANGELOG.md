# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2024-06-12 (Stable)

### Major Features
- **UI Overhaul (Notion Style):** A complete visual redesign inspired by Notion. Features a clean, minimalist aesthetic, improved typography, sidebar navigation, and a focus on distraction-free content management.
- **Interactive Setup Wizard:** A completely redesigned onboarding experience featuring a recursive file tree explorer to easily select content directories.
- **Optimistic Locking:** Implemented SHA-checking before all write operations to prevent overwriting files modified by other users.
- **Performance Overhaul:** Switched to the Git Tree API (Recursive) for listing files, significantly reducing API calls and improving load times for large repositories.

### Improvements
- **Project Types:** Distinct modes for "Web Project" (with live domain preview) and "File Library" (raw file access).
- **Deep Linking:** Application state (tabs) is now synced with the URL query parameters.
- **Global Sync Status:** Added a real-time indicator in the sidebar/header to show repository synchronization status.
- **Settings Management:** Added ability to import/export local configuration settings.
- **Image Handling:** Improved regex for updating image paths in Markdown content during "Post Creation" workflow.

### Fixes
- Fixed CORS issues when validating external images.
- Fixed pagination logic (replaced by infinite scroll/load more in image view and cached tree view in posts).
- Fixed issues where private repository images would not load in previews.

## [1.4.0-beta] - 2024-06-10

### Added
- Initial beta release of the refactored architecture.
- **Client-side Encryption:** Enhanced security for PAT storage using Web Crypto API.

## [1.3.2] - 2024-05-27

### Added
- **Multi-language Support:** English (en) and Vietnamese (vi).
- **Image Compression:** Settings for auto-compression and resizing.
- **Image Manager:** Dedicated tab for asset management.

### Changed
- **Flexible Logout Flow:** Option to clear all settings or just the session.

## Roadmap (Upcoming)

### Planned Features
- **Multi-Service Support:** Support for **Gitea** and **Gogs** self-hosted repositories is currently in development (Hidden feature in v1.4.0).
- **GitLab Integration:** Native support for GitLab API.
- **Draft Mode:** Local drafts with auto-save before committing to Git.