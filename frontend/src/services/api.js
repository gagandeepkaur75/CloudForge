import axios from 'axios';
import { authService } from './auth';

const API_BASE_URL = import.meta.env?.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  if (!API_BASE_URL) {
    throw new Error('The CloudForge API is not configured. Set VITE_API_URL to the deployed API Gateway URL.');
  }

  const token = await authService.getValidToken();
  if (!token) {
    throw new Error('Your session has expired. Sign in again to continue.');
  }
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function unsupported(operation) {
  throw new Error(`${operation} is not available because the backend endpoint has not been implemented.`);
}

function projectPath(projectId) {
  return `/projects/${encodeURIComponent(projectId)}`;
}

function filePath(projectId, fileName) {
  return `${projectPath(projectId)}/files/${encodeURIComponent(fileName)}`;
}

export const api = {
  getProjects() {
    return apiClient.get('/projects');
  },

  getProjectDetails(projectId) {
    return apiClient.get(projectPath(projectId));
  },

  createProject(data) {
    return apiClient.post('/projects', data);
  },

  updateProject(projectId, updates) {
    return apiClient.put(projectPath(projectId), updates);
  },

  deleteProject(projectId) {
    return apiClient.delete(projectPath(projectId));
  },

  getFolders(projectId) {
    return apiClient.get(`${projectPath(projectId)}/folders`);
  },

  createFolder(projectId, folderName) {
    return apiClient.post(`${projectPath(projectId)}/folders`, { folderName });
  },

  deleteFolder(projectId, folderName) {
    return apiClient.delete(`${projectPath(projectId)}/folders/${encodeURIComponent(folderName)}`);
  },

  getFiles(projectId) {
    return apiClient.get(`${projectPath(projectId)}/files`);
  },

  getDownloadUrl(projectId, fileName) {
    return apiClient.get(`${filePath(projectId, fileName)}/download`);
  },

  getUploadUrl(projectId, fileName, fileType = 'application/octet-stream', category = 'General') {
    return apiClient.post(`${projectPath(projectId)}/upload-url`, { fileName, fileType, category });
  },

  uploadFileToS3(uploadUrl, file, onProgress, signedHeaders = {}) {
    return axios.put(uploadUrl, file, {
      headers: { ...signedHeaders, 'Content-Type': file.type || 'application/octet-stream' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({ loaded: progressEvent.loaded, total: progressEvent.total, percent });
        }
      }
    });
  },

  deleteFile(projectId, fileName) {
    return apiClient.delete(filePath(projectId, fileName));
  },

  renameFile(projectId, fileName, newName) {
    return apiClient.put(`${filePath(projectId, fileName)}/rename`, { newName });
  },

  getVersions(projectId, fileName) {
    return apiClient.get(`${filePath(projectId, fileName)}/versions`);
  },

  getFileVersions(projectId, fileName) {
    return this.getVersions(projectId, fileName);
  },

  getVersionDownloadUrl(projectId, fileName, versionId) {
    return apiClient.get(`${filePath(projectId, fileName)}/versions/download`, { params: { versionId } });
  },

  restoreVersion(projectId, fileName, versionId) {
    return apiClient.post(`${filePath(projectId, fileName)}/recover`, { versionId });
  },

  recoverFileVersion(projectId, fileName, versionId) {
    return this.restoreVersion(projectId, fileName, versionId);
  },

  shareFile(projectId, fileName, expiryMinutes, permission = 'Download Access') {
    return apiClient.post(`${filePath(projectId, fileName)}/share`, { expiryMinutes, permission });
  },

  createShareLink(data) {
    const expiryMinutes = data.expiryMinutes || (data.expiryHours || 1) * 60;
    return this.shareFile(data.projectId, data.fileName, expiryMinutes, data.permission || 'Download Access');
  },

  getSharedLinks() {
    return apiClient.get('/shares');
  },

  revokeShareLink(linkId) {
    return apiClient.delete(`/shares/${encodeURIComponent(linkId)}`);
  },

  async getTeamMembers(projectId) {
    const response = await this.getProjectDetails(projectId);
    const members = response.data.members || [];
    return {
      data: {
        members: members.map((member) => typeof member === 'string'
          ? { email: member, name: member, role: member === response.data.ownerEmail ? 'Admin' : 'Contributor' }
          : { ...member, name: member.name || member.email })
      }
    };
  },

  inviteMember(projectId, email, role = 'Contributor') {
    return apiClient.post(`${projectPath(projectId)}/members`, { email, role });
  },

  updateMemberRole(projectId, email, role) {
    return apiClient.put(`${projectPath(projectId)}/members/${encodeURIComponent(email)}`, { role });
  },

  removeMember(projectId, email) {
    return apiClient.delete(`${projectPath(projectId)}/members/${encodeURIComponent(email)}`);
  },

  getActivityLogs(projectId) {
    return apiClient.get(`${projectPath(projectId)}/activities`);
  },

  async getSnapshots() {
    const projectsResponse = await this.getProjects();
    const projectList = projectsResponse.data.projects || [];
    const snapshots = await Promise.all(projectList.map(async (project) => {
      const response = await apiClient.get(`${projectPath(project.projectId)}/snapshots`);
      return response.data.snapshots || [];
    }));
    return { data: { snapshots: snapshots.flat() } };
  },

  createSnapshot(data) {
    return apiClient.post(`${projectPath(data.projectId)}/snapshot`, {
      snapshotName: data.snapshotName,
      description: data.description
    });
  },

  getBackupInfo() {
    return unsupported('Reading AWS Backup information');
  },

  restoreBackup() {
    return unsupported('Restoring AWS Backup records');
  }
};
