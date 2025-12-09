# Project Overview: Astro Content Manager
> Version 1.4.0 (Stable)

This document provides a detailed overview of the Astro Content Manager, including its functionality, technical stack, and setup instructions.

## 1. Introduction

The Astro Content Manager is a client-side web application designed to simplify the process of adding and managing content (Markdown/MDX posts and images) in a project hosted on **GitHub**. It provides a feature-rich, user-friendly dashboard that communicates directly with the GitHub API, eliminating the need for `git` commands or local development environments for most content-related tasks.

The entire application runs in the browser. User credentials (Personal Access Token) are encrypted using the **Web Crypto API** before being stored in `sessionStorage` for the current browser session.

## 2. Core Functionality

### User Interface Design
- **Notion-Inspired Aesthetic:** The UI has been completely redesigned in v1.4.0 to mirror the clean, minimalist look of Notion.
- **Focus:** Emphasis on typography, whitespace, and subtle interactions to reduce cognitive load.
- **Navigation:** A collapsible sidebar allows quick switching between managing posts, images, settings, and backups.

### Git Service Authentication
- **Provider:** Currently supports **GitHub** (Cloud/Enterprise). *Support for Gitea and Gogs is currently in experimental roadmap status.*
- **Connection:** Requires a Personal Access Token (PAT) and repository URL.
- **Security:** Tokens are **encrypted client-side** (AES-GCM) and stored in ephemeral storage (`sessionStorage`). They are never sent to any third-party server, only directly to GitHub's API.

### Interactive First-Time Setup
- **Wizard:** Upon first connection, the app scans the repository structure.
- **File Explorer:** Users can browse the repository tree to visually select the `posts` and `images` directories.
- **Suggestions:** The app intelligently suggests folders based on file extensions found during the scan.

### Performance & Safety
- **Git Tree API:** Utilizes recursive tree fetching to handle repositories with thousands of files efficiently, minimizing API round-trips.
- **Optimistic Locking:** Before saving changes, the app verifies the file's SHA hash against the server. If a conflict is detected (the file changed since it was loaded), the save is prevented to avoid data loss.
- **Global Sync Status:** A persistent badge indicates if the app is currently syncing data or if all changes are saved.

### The Dashboard
The interface is divided into functional tabs, fully responsive for mobile and desktop.

#### **Manage Posts**
- **Table/Grid Views:** Toggle between a dense data table or a visual grid with cover images.
- **Sorting & Filtering:** Search by text; sort by date or title.
- **Editing:** Update frontmatter properties and markdown content via a split-pane editor (Preview/Code).

#### **Create Post Workflow**
- **Step-by-Step:** A guided wizard:
    1.  **Assets:** Batch upload and compress images.
    2.  **Content:** Upload a Markdown file. The app validates frontmatter against your template and checks image links.
    3.  **Publish:** Commits images and the post file in a streamlined sequence.

#### **Manage Images**
- **Gallery:** Visual grid of assets in the selected images directory.
- **Utilities:** Copy public/relative URLs to clipboard, delete unused images, and upload new assets.

#### **Configuration & Maintenance**
- **Template Generator:** Define strict validation rules for frontmatter (required fields, data types) by analyzing an existing post.
- **Backups:** Generate client-side `.zip` archives of your content directories using `JSZip`.
- **Settings:** Customize commit messages, enable image compression (max width/size), and toggle UI language (English/Vietnamese).

## 3. Architecture

### Adapter Pattern
The application uses an Adapter pattern to abstract Git provider differences:
- `IGitService`: The common interface.
- `GithubAdapter`: Implements GitHub REST API v3.
- *Note: The architecture supports future expansion to Gitea/Gogs adapters.*

This allows the UI components (`Dashboard`, `PostList`) to remain agnostic of the underlying service.

### State Management
- **Session:** Encrypted token stored in `sessionStorage`.
- **Config:** Repository-specific settings (paths, project type) stored in `localStorage` and optionally synced to a `.acmrc.json` file in the repository root.
- **URL Sync:** Active views are synced to the URL query string for deep linking support.

## 4. Technical Stack

- **Framework:** **React 19**
- **Language:** **TypeScript**
- **Styling:** **Tailwind CSS** (Custom configured for Notion-style aesthetics)
- **bundling:** No build step required (ESM modules via CDN).
- **Libraries:**
  - `marked` & `dompurify`: Secure Markdown rendering.
  - `js-yaml`: Robust Frontmatter parsing.
  - `jszip`: Client-side backup generation.

## 5. Setup and Installation

As a purely client-side application, there is no server-side setup required.

1.  **Clone/Download:** Get the `index.html` and associated files.
2.  **Serve:** Run via a local server (e.g., `python -m http.server` or `npx live-server`).
3.  **Login:** Enter your GitHub credentials.
4.  **Configure:** Follow the setup wizard.