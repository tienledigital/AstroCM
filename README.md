
# Astro Content Manager
> **Version:** 1.4.0 (Stable)

A simple, clean web interface to upload Markdown/MDX posts and images directly to your project's repository on **GitHub**. Streamline your content workflow without leaving the browser.

<p align="center">
  <img src="https://raw.githubusercontent.com/tienledigital/AstroCM/main/.github/assets/screenshot-1.png" width="100%" alt="Astro Content Manager Preview">
</p>

**Quick Links:** [Project Overview](./OVERVIEW.md) • [Changelog](./CHANGELOG.md) • [Licenses](./LICENSES.md)

---

## ✨ Key Features

- **Comprehensive UI Redesign:** A completely new **Notion-style** interface. Minimalist, content-focused, and designed for distraction-free writing.
- **Interactive Setup Wizard:** Automatically scans your repository to suggest content directories using a visual file tree explorer.
- **Smart Architecture:**
  - **Optimistic Locking:** Prevents overwriting files if they have changed on the server since you opened them.
  - **Client-Side Caching:** Uses the Git Tree API for fast navigation in large repositories.
- **Comprehensive Dashboard:**
  - **Manage Posts:** Search, sort, filter, and edit existing Markdown/MDX content.
  - **Manage Images:** Dedicated gallery view with upload, preview, and delete functionality.
  - **Workflows:** Step-by-step wizard for creating new posts with validation.
- **Advanced Configuration:**
  - **Project Types:** Toggle between "Web Project" (Astro/Next.js) for live image previews or "File Library" for raw file management.
  - **Template Validation:** Enforce frontmatter structure using custom templates.
  - **Image Optimization:** Automatic client-side compression and resizing before upload.
- **Data Safety:**
  - **Local Encryption:** Your Personal Access Token (PAT) is encrypted using Web Crypto API and stored only in `sessionStorage`.
  - **Backups:** One-click download of your posts or images as `.zip` archives.
- **Internationalization:** Fully localized in English and Vietnamese.

---

## 🚀 Getting Started

For a detailed guide on setup, functionality, and the technical stack, please see the [**Project Overview**](./OVERVIEW.md).

1.  **Generate an Access Token:**
    - Create a [Fine-Grained Personal Access Token](https://github.com/settings/tokens/new?type=beta) on GitHub.
    - Grant it access to the specific repository you want to manage.
    - Set **"Contents"** permissions to **"Read and write"**.
2.  **Connect:** Open the app and enter your repository details (e.g., `username/repo`).
3.  **Setup:** Follow the on-screen wizard to select your content and asset directories.
4.  **Manage:** Start creating and updating content immediately!

---

## 📅 Roadmap

- **Self-Hosted Support:** Adapters for **Gitea** and **Gogs** are currently in experimental testing and will be released in v1.5.0.
- **GitLab Support:** Planned integration for GitLab repositories.
- **AI Writing Assistant:** Integration with AI models to assist in drafting content.

---

## 🖼️ Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/tienledigital/AstroCM/main/.github/assets/screenshot-2.png" width="32%" alt="Dashboard View">
  <img src="https://raw.githubusercontent.com/tienledigital/AstroCM/main/.github/assets/screenshot-3.png" width="32%" alt="Post Management">
  <img src="https://raw.githubusercontent.com/tienledigital/AstroCM/main/.github/assets/screenshot-4.png" width="32%" alt="New Post Creator">
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/tienledigital/AstroCM/main/.github/assets/screenshot-5.png" width="32%" alt="Settings Page">
  <img src="https://raw.githubusercontent.com/tienledigital/AstroCM/main/.github/assets/screenshot-6.png" width="32%" alt="Image Management">
  <img src="https://raw.githubusercontent.com/tienledigital/AstroCM/main/.github/assets/screenshot-7.png" width="32%" alt="Template Management">
</p>

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS (Custom Notion-inspired theme)
- **API:** Native Fetch API (GitHub REST API v3)
- **Utilities:** Marked, DOMPurify, JSZip
- **Security:** Web Crypto API (AES-GCM)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for bugs, features, or suggestions.

## 📄 License

This project is licensed under the MIT License. See the [LICENSES.md](./LICENSES.md) file for more details on third-party software.
