import { GithubUser, GithubRepo } from '../types';
import { BaseGiteaAdapter, makeGiteaRequest } from './baseGiteaService';

export const verifyToken = (token: string, baseUrl: string): Promise<GithubUser> => {
  return makeGiteaRequest<GithubUser>('/user', token, baseUrl);
};

export const getRepoDetails = (token: string, owner: string, repo: string, baseUrl: string): Promise<GithubRepo> => {
  return makeGiteaRequest<GithubRepo>(`/repos/${owner}/${repo}`, token, baseUrl);
};

export class GogsAdapter extends BaseGiteaAdapter {
    constructor(token: string, owner: string, repoName: string, baseUrl: string) {
        super(token, owner, repoName, baseUrl);
    }
}
