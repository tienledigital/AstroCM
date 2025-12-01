# Astro Content Manager
> Current Version: 1.3.3

A simple, clean web interface to upload Markdown/MDX posts and images directly to your Astro project's GitHub repository. Streamline your content workflow without leaving the browser.

![Astro Content Manager Preview](.github/app-preview.png)

**Quick Links:** [Project Overview](./OVERVIEW.md) • [User Guide](./GUIDE.md) • [Changelog](./CHANGELOG.md) • [Licenses](./LICENSES.md)

---

## ✨ Key Features

- **Direct GitHub Integration:** Connects securely to your GitHub account using an encrypted, session-stored Personal Access Token.
- **Smart Initial Setup:** Automatically scans your repository to suggest content directories, getting you started faster.
- **Comprehensive Post Management:** A powerful dashboard to list, search, preview, and update existing posts.
- **Streamlined Post Creation:** A guided, step-by-step workflow for publishing new posts, complete with image uploads.
- **Image Management:** Browse, search, copy production-ready URLs, and delete images from your assets directory to keep your repository clean.
- **Frontmatter Validation:** Define a custom template from an existing post to enforce consistent structure for all new content.
- **Multi-language Support:** Fully localized interface supporting English (en) and Vietnamese (vi).
- **Content Backup:** Easily download `.zip` archives of your posts and images directories.
- **Highly Configurable:** Customize content paths, commit message templates, image compression, and more in the settings panel.

---

## 🚀 Getting Started

To use the Astro Content Manager, you just need to open the `index.html` file in your browser. For a more detailed guide on setup, functionality, and the technical stack, please see the [**Project Overview**](./OVERVIEW.md).

1.  **Generate a GitHub Fine-Grained PAT:** Create a [Fine-Grained Personal Access Token](https://github.com/settings/tokens/new?type=beta). Grant it access to the specific repository you want to manage with **"Contents"** permissions set to **"Read and write"**.
2.  **Connect:** Open the app, paste your repository URL and your token to connect.
3.  **Setup:** Select your posts directory from the suggested paths or pick one manually.
4.  **Manage:** Use the dashboard to manage your existing content or create new posts!

## 🖼️ Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/tienledigital/astro-content-manager/main/.github/assets/screenshot-1.png" width="32%" alt="Dashboard View">
  <img src="https://raw.githubusercontent.com/tienledigital/astro-content-manager/main/.github/assets/screenshot-2.png" width="32%" alt="Post Management">
  <img src="https://raw.githubusercontent.com/tienledigital/astro-content-manager/main/.github/assets/screenshot-3.png" width="32%" alt="New Post Creator">
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/tienledigital/astro-content-manager/main/.github/assets/screenshot-4.png" width="32%" alt="Settings Page">
  <img src="https://raw.githubusercontent.com/tienledigital/astro-content-manager/main/.github/assets/screenshot-5.png" width="32%" alt="Image Management">
  <img src="https://raw.githubusercontent.com/tienledigital/astro-content-manager/main/.github/assets/screenshot-6.png" width="32%" alt="Template Management">
</p>

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript
- **Styling:** Tailwind CSS
- **API:** GitHub REST API
- **Utilities:** Marked & DOMPurify (for Markdown preview), JSZip (for backups)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for bugs, features, or suggestions.

## 📄 License

This project is licensed under the MIT License. See the [LICENSES.md](./LICENSES.md) file for more details on third-party software.
