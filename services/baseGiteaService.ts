
import { GithubUser, GithubRepo, GithubContent, RepoTreeInfo } from '../types';
import { BaseGitService } from './baseGitService';

export const makeGiteaRequest = async <T,>(endpoint: string, token: string, baseUrl: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${baseUrl}/api/v1${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `token ${token}`,
      'Accept': 'application/json',
    },
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth-error'));
    throw new Error('Unauthorized: Token expired or invalid.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown Gitea/Gogs error occurred' }));
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.message || errorData.error || ''}`);
  }

  if (response.status === 204 || response.status === 201 || (response.status === 200 && (options.method === 'DELETE' || options.method === 'PUT'))) {
     return response.json().catch(() => ({} as T));
  }
  
  return response.json();
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result) {
        resolve((reader.result as string).split(',')[1]);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

const base64Encode = (str: string): string => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let binary = '';
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

export abstract class BaseGiteaAdapter extends BaseGitService {
    protected baseUrl: string;

    constructor(token: string, owner: string, repoName: string, baseUrl: string) {
        super(token, owner, repoName);
        this.baseUrl = baseUrl.replace(/\/$/, ''); // remove trailing slash
    }

    protected async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return makeGiteaRequest<T>(endpoint, this.token, this.baseUrl, options);
    }
    
    protected async getFileSha(path: string): Promise<string | undefined> {
        try {
            const fileData = await this.makeRequest<{ sha: string }>(`/repos/${this.owner}/${this.repoName}/contents/${path}`);
            return fileData.sha;
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                return undefined; // File doesn't exist
            }
            throw error;
        }
    }

    async getRepoDetails(): Promise<GithubRepo> {
        return this.makeRequest<GithubRepo>(`/repos/${this.owner}/${this.repoName}`);
    }

    async getRepoContents(path: string): Promise<GithubContent[]> {
        return this.makeRequest<GithubContent[]>(`/repos/${this.owner}/${this.repoName}/contents/${path}`);
    }

    // Optimized listing using Git Tree API
    async listFiles(path: string): Promise<RepoTreeInfo[]> {
        try {
            const repo = await this.getRepoDetails();
            const branch = repo.default_branch;
            
            const response = await this.makeRequest<{ tree: any[], truncated: boolean }>(`/repos/${this.owner}/${this.repoName}/git/trees/${branch}?recursive=1`);
            
            if (response.truncated) {
                console.warn("Tree response truncated.");
            }

            const normalizedPath = path ? (path.endsWith('/') ? path : path + '/') : '';
            
            return response.tree
                .filter((item: any) => item.type === 'blob' && (normalizedPath === '' || item.path.startsWith(normalizedPath)))
                .map((item: any) => ({
                    name: item.path.split('/').pop() || '',
                    path: item.path,
                    type: 'file',
                    sha: item.sha,
                    size: item.size
                }));
        } catch (e) {
            console.error("Tree API failed, falling back", e);
            return super.listFiles(path);
        }
    }

    async getFileContent(path: string): Promise<string> {
        const fileData = await this.makeRequest<GithubContent>(`/repos/${this.owner}/${this.repoName}/contents/${path}`);
        if (fileData.content && fileData.encoding === 'base64') {
            const binaryString = atob(fileData.content);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new TextDecoder('utf-8').decode(bytes);
        }
        throw new Error('Could not decode file content from Gitea/Gogs.');
    }

    async uploadFile(path: string, file: File, commitMessage: string, sha?: string): Promise<any> {
        const content = await fileToBase64(file);
        const finalSha = sha || await this.getFileSha(path);

        if (finalSha) { // File exists, update it
             const body = { message: commitMessage, content: content, sha: finalSha };
            return this.makeRequest(`/repos/${this.owner}/${this.repoName}/contents/${path}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            });
        } else { // File is new, create it
            const body = { message: commitMessage, content: content };
            return this.makeRequest(`/repos/${this.owner}/${this.repoName}/contents/${path}`, {
                method: 'POST',
                body: JSON.stringify(body),
            });
        }
    }

    async createFileFromString(path: string, newContent: string, commitMessage: string): Promise<any> {
        const sha = await this.getFileSha(path);
        if (sha) {
            throw new Error(`A file with the name '${path.split('/').pop()}' already exists in this directory.`);
        }
        const content = base64Encode(newContent);
        const body = { message: commitMessage, content: content };
        return this.makeRequest(`/repos/${this.owner}/${this.repoName}/contents/${path}`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async updateFileContent(path: string, newContent: string, commitMessage: string, sha: string): Promise<any> {
        const content = newContent.startsWith('data:') ? newContent.split(',')[1] : base64Encode(newContent);
        const body = { message: commitMessage, content: content, sha: sha };
        return this.makeRequest(`/repos/${this.owner}/${this.repoName}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    async deleteFile(path: string, sha: string, commitMessage: string): Promise<any> {
        const body = { message: commitMessage, sha: sha };
        return this.makeRequest(`/repos/${this.owner}/${this.repoName}/contents/${path}`, {
            method: 'DELETE',
            body: JSON.stringify(body),
        });
    }

    async getFileAsBlob(path: string): Promise<Blob> {
        const fileData = await this.makeRequest<GithubContent>(`/repos/${this.owner}/${this.repoName}/contents/${path}`);
        if (fileData.content && fileData.encoding === 'base64') {
            const binaryString = atob(fileData.content);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const extension = fileData.name.split('.').pop()?.toLowerCase() || '';
            let mimeType = 'application/octet-stream';
            switch (extension) {
                case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
                case 'png': mimeType = 'image/png'; break;
                case 'gif': mimeType = 'image/gif'; break;
                case 'webp': mimeType = 'image/webp'; break;
                case 'svg': mimeType = 'image/svg+xml'; break;
                case 'bmp': mimeType = 'image/bmp'; break;
            }
            
            return new Blob([bytes], { type: mimeType });
        }
        throw new Error(`Could not get file content for path: ${path}`);
    }

    async getRepoTree(path: string = ''): Promise<RepoTreeInfo[]> {
        const contents = await this.getRepoContents(path);
        const processedItems = await Promise.all(
            contents.map(async (item): Promise<RepoTreeInfo | null> => {
                if (this.ignoredTreeDirs.has(item.name.toLowerCase())) return null;
                if (item.type === 'dir') {
                    try {
                        const subContents = await this.getRepoContents(item.path);
                        const hasMarkdown = subContents.some(subItem => subItem.type === 'file' && (subItem.name.endsWith('.md') || subItem.name.endsWith('.mdx')));
                        return { path: item.path, name: item.name, type: 'dir', hasMarkdown, sha: item.sha };
                    } catch (e) {
                        return { path: item.path, name: item.name, type: 'dir', hasMarkdown: false, sha: item.sha };
                    }
                }
                return { path: item.path, name: item.name, type: 'file', sha: item.sha, size: item.size };
            })
        );
        const validItems = processedItems.filter((item): item is RepoTreeInfo => item !== null);
        validItems.sort((a, b) => {
            if (a.type === 'dir' && b.type !== 'dir') return -1;
            if (a.type !== 'dir' && b.type === 'dir') return 1;
            return a.name.localeCompare(b.name);
        });
        return validItems;
    }
}