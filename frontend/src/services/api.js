/**
 * CloudForge Comprehensive API & Mock Data Service
 * Supports AWS API Gateway + S3 Direct Uploads AND a rich, fully dynamic
 * local persistent data store for all 10 CloudForge pages.
 */

import axios from 'axios';
import { authService, DEMO_USERS } from './auth';

const API_BASE_URL = import.meta.env?.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  const user = authService.getCurrentUser();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (user) {
    config.headers['X-User-Email'] = user.email;
    config.headers['X-User-Roles'] = user.role;
  }
  return config;
});

// =============================================================================
// Persistent Local Store for Full SaaS Demo Functionality
// =============================================================================
const MOCK_STORAGE_KEY = 'cloudforge_saas_db_v2';

export function getMockDb() {
  const saved = localStorage.getItem(MOCK_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing mock DB, resetting', e);
    }
  }

  const initialDb = {
    projects: [
      {
        projectId: 'proj-ucs531-team04',
        title: 'CloudForge Serverless Workspace',
        description: 'End-to-end cloud-based collaborative project workspace for Course UCS531.',
        category: 'Cloud Architecture',
        visibility: 'Team Shared',
        status: 'In Progress',
        ownerEmail: 'gkaur10_be24@thapar.edu',
        members: [
          { email: 'gkaur10_be24@thapar.edu', name: 'Gagandeep Kaur', role: 'Admin', joinedDate: '2026-11-01', status: 'Active', avatar: 'GK' },
          { email: 'psingh18_be24@thapar.edu', name: 'Puneet Singh', role: 'Editor', joinedDate: '2026-11-03', status: 'Active', avatar: 'PS' },
          { email: 'agupta5_be24@thapar.edu', name: 'Aditya Gupta', role: 'Editor', joinedDate: '2026-11-05', status: 'Active', avatar: 'AG' }
        ],
        totalStorageBytes: 15420000,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        lastModified: new Date(Date.now() - 3600000 * 2).toISOString(),
        snapshotStatus: 'NONE'
      },
      {
        projectId: 'proj-distributed-db',
        title: 'Distributed Key-Value Store with Raft',
        description: 'High-throughput fault-tolerant distributed consensus engine implemented on AWS EC2 clusters.',
        category: 'Distributed Systems',
        visibility: 'Team Shared',
        status: 'Submitted',
        ownerEmail: 'psingh18_be24@thapar.edu',
        members: [
          { email: 'psingh18_be24@thapar.edu', name: 'Puneet Singh', role: 'Admin', joinedDate: '2026-10-15', status: 'Active', avatar: 'PS' },
          { email: 'gkaur10_be24@thapar.edu', name: 'Gagandeep Kaur', role: 'Viewer', joinedDate: '2026-10-16', status: 'Active', avatar: 'GK' }
        ],
        totalStorageBytes: 4210000,
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        lastModified: new Date(Date.now() - 86400000 * 3).toISOString(),
        snapshotStatus: 'SUBMITTED'
      },
      {
        projectId: 'proj-ai-vision',
        title: 'Autonomous Drone Obstacle Detection',
        description: 'Edge computer vision neural network trained on synthetic aerial datasets.',
        category: 'AI & Machine Learning',
        visibility: 'Private',
        status: 'In Progress',
        ownerEmail: 'agupta5_be24@thapar.edu',
        members: [
          { email: 'agupta5_be24@thapar.edu', name: 'Aditya Gupta', role: 'Admin', joinedDate: '2026-11-10', status: 'Active', avatar: 'AG' }
        ],
        totalStorageBytes: 8900000,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastModified: new Date(Date.now() - 3600000 * 8).toISOString(),
        snapshotStatus: 'NONE'
      }
    ],

    // Folders per project
    folders: {
      'proj-ucs531-team04': ['Source Code', 'Datasets', 'Reports', 'Documentation', 'Presentations'],
      'proj-distributed-db': ['Source Code', 'Reports', 'Documentation'],
      'proj-ai-vision': ['Source Code', 'Datasets', 'Reports']
    },

    // Files per project
    files: {
      'proj-ucs531-team04': [
        {
          fileId: 'f-1',
          fileName: 'serverless_pipeline.py',
          folder: 'Source Code',
          fileType: 'python',
          sizeBytes: 18400,
          uploadedBy: 'psingh18_be24@thapar.edu',
          uploadedDate: new Date(Date.now() - 86400000 * 3).toISOString(),
          lastModified: new Date(Date.now() - 3600000 * 4).toISOString(),
          versionCount: 4,
          content: 'import boto3\nimport json\n\ndef handler(event, context):\n    print("Processing CloudForge SQS Event")\n    return {"status": 200}'
        },
        {
          fileId: 'f-2',
          fileName: 'system_architecture_spec.pdf',
          folder: 'Reports',
          fileType: 'pdf',
          sizeBytes: 2450000,
          uploadedBy: 'gkaur10_be24@thapar.edu',
          uploadedDate: new Date(Date.now() - 86400000 * 4).toISOString(),
          lastModified: new Date(Date.now() - 3600000 * 2).toISOString(),
          versionCount: 3,
          content: 'CloudForge Technical Architecture Document\nVersion: 3.0\nAuthor: Gagandeep Kaur'
        },
        {
          fileId: 'f-3',
          fileName: 'benchmark_results_dataset.csv',
          folder: 'Datasets',
          fileType: 'csv',
          sizeBytes: 8540000,
          uploadedBy: 'agupta5_be24@thapar.edu',
          uploadedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          lastModified: new Date(Date.now() - 86400000 * 2).toISOString(),
          versionCount: 2,
          content: 'run_id,latency_ms,throughput_req_sec,status\n1,42.5,1240,SUCCESS\n2,39.1,1380,SUCCESS'
        },
        {
          fileId: 'f-4',
          fileName: 'final_presentation_slides.pptx',
          folder: 'Presentations',
          fileType: 'pptx',
          sizeBytes: 4411600,
          uploadedBy: 'gkaur10_be24@thapar.edu',
          uploadedDate: new Date(Date.now() - 86400000).toISOString(),
          lastModified: new Date(Date.now() - 1800000).toISOString(),
          versionCount: 2,
          content: 'CloudForge - 10 Slide Project Presentation Deck'
        },
        {
          fileId: 'f-5',
          fileName: 'api_gateway_specification.md',
          folder: 'Documentation',
          fileType: 'markdown',
          sizeBytes: 24500,
          uploadedBy: 'psingh18_be24@thapar.edu',
          uploadedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          lastModified: new Date(Date.now() - 86400000).toISOString(),
          versionCount: 1,
          content: '# API Gateway Endpoints\n\n- GET /projects\n- POST /projects/{id}/upload-url\n- POST /projects/{id}/snapshot'
        }
      ]
    },

    // Versions history
    versions: {
      'proj-ucs531-team04/system_architecture_spec.pdf': [
        {
          versionNumber: 'v3',
          versionId: 's3-ver-9941a87e2b',
          isLatest: true,
          modifiedDate: new Date(Date.now() - 3600000 * 2).toISOString(),
          sizeBytes: 2450000,
          modifiedBy: 'gkaur10_be24@thapar.edu',
          notes: 'Added EventBridge and SQS decoupled pipeline schematics'
        },
        {
          versionNumber: 'v2',
          versionId: 's3-ver-8831f12d4a',
          isLatest: false,
          modifiedDate: new Date(Date.now() - 86400000).toISOString(),
          sizeBytes: 2310000,
          modifiedBy: 'psingh18_be24@thapar.edu',
          notes: 'Added DynamoDB single-table design notes'
        },
        {
          versionNumber: 'v1',
          versionId: 's3-ver-7720c09e1f',
          isLatest: false,
          modifiedDate: new Date(Date.now() - 86400000 * 4).toISOString(),
          sizeBytes: 1980000,
          modifiedBy: 'gkaur10_be24@thapar.edu',
          notes: 'Initial architecture blueprint draft'
        }
      ],
      'proj-ucs531-team04/serverless_pipeline.py': [
        {
          versionNumber: 'v4',
          versionId: 's3-ver-py-4',
          isLatest: true,
          modifiedDate: new Date(Date.now() - 3600000 * 4).toISOString(),
          sizeBytes: 18400,
          modifiedBy: 'psingh18_be24@thapar.edu',
          notes: 'Fixed snapshot recursion exclusion check'
        },
        {
          versionNumber: 'v3',
          versionId: 's3-ver-py-3',
          isLatest: false,
          modifiedDate: new Date(Date.now() - 86400000).toISOString(),
          sizeBytes: 17200,
          modifiedBy: 'agupta5_be24@thapar.edu',
          notes: 'Added DynamoDB atomic storage increment'
        },
        {
          versionNumber: 'v2',
          versionId: 's3-ver-py-2',
          isLatest: false,
          modifiedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          sizeBytes: 15100,
          modifiedBy: 'psingh18_be24@thapar.edu',
          notes: 'Added SQS batch record iteration'
        },
        {
          versionNumber: 'v1',
          versionId: 's3-ver-py-1',
          isLatest: false,
          modifiedDate: new Date(Date.now() - 86400000 * 3).toISOString(),
          sizeBytes: 12000,
          modifiedBy: 'psingh18_be24@thapar.edu',
          notes: 'Initial S3 event receiver lambda skeleton'
        }
      ]
    },

    // Shared Links
    sharedLinks: [
      {
        linkId: 'link-101',
        projectId: 'proj-ucs531-team04',
        projectName: 'CloudForge Serverless Workspace',
        fileName: 'system_architecture_spec.pdf',
        sharedBy: 'gkaur10_be24@thapar.edu',
        permission: 'Download Access',
        createdDate: new Date(Date.now() - 3600000 * 12).toISOString(),
        expirationDate: new Date(Date.now() + 3600000 * 12).toISOString(),
        status: 'Active',
        shareUrl: 'https://cloudforge-storage.s3.amazonaws.com/share/link-101-token-temp-valid'
      },
      {
        linkId: 'link-102',
        projectId: 'proj-ucs531-team04',
        projectName: 'CloudForge Serverless Workspace',
        fileName: 'benchmark_results_dataset.csv',
        sharedBy: 'agupta5_be24@thapar.edu',
        permission: 'View Only',
        createdDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        expirationDate: new Date(Date.now() - 3600000).toISOString(),
        status: 'Expired',
        shareUrl: 'https://cloudforge-storage.s3.amazonaws.com/share/link-102-token-expired'
      }
    ],

    // Snapshots
    snapshots: [
      {
        snapshotId: 'snap-01',
        snapshotName: 'Final Academic Submission v1.0',
        projectId: 'proj-distributed-db',
        projectName: 'Distributed Key-Value Store with Raft',
        description: 'Complete codebase, benchmark datasets, and final project documentation for grading.',
        createdBy: 'psingh18_be24@thapar.edu',
        createdDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        fileCount: 14,
        status: 'Submitted',
        s3Prefix: 'snapshots/proj-distributed-db/20261120_143000/',
        zipKey: 'final_submission_proj-distributed-db.zip',
        downloadUrl: 'https://cloudforge-storage.s3.amazonaws.com/snapshots/proj-distributed-db/final_submission.zip'
      }
    ],

    // Backup Information
    backup: {
      lastBackupDate: new Date(Date.now() - 3600000 * 6).toISOString(),
      status: 'Healthy (Synced with AWS Backup Vault)',
      vaultName: 'CloudForgeBackupVault',
      availableRecords: [
        { id: 'bak-101', date: new Date(Date.now() - 86400000).toISOString(), size: '28.5 MB', type: 'Daily Automated', status: 'Available' },
        { id: 'bak-102', date: new Date(Date.now() - 86400000 * 2).toISOString(), size: '26.8 MB', type: 'Daily Automated', status: 'Available' },
        { id: 'bak-103', date: new Date(Date.now() - 86400000 * 7).toISOString(), size: '22.1 MB', type: 'Weekly Snapshot', status: 'Archived' }
      ]
    },

    // Activity Logs
    activities: [
      {
        id: 'act-1',
        projectId: 'proj-ucs531-team04',
        projectName: 'CloudForge Serverless Workspace',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        action: 'FILE_UPLOADED',
        actor: 'Gagandeep Kaur',
        actorEmail: 'gkaur10_be24@thapar.edu',
        details: "Uploaded 'final_presentation_slides.pptx' (4.4 MB) to Presentations folder.",
        fileName: 'final_presentation_slides.pptx'
      },
      {
        id: 'act-2',
        projectId: 'proj-ucs531-team04',
        projectName: 'CloudForge Serverless Workspace',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        action: 'VERSION_RESTORED',
        actor: 'Puneet Singh',
        actorEmail: 'psingh18_be24@thapar.edu',
        details: "Restored 'system_architecture_spec.pdf' to historical version v3.",
        fileName: 'system_architecture_spec.pdf'
      },
      {
        id: 'act-3',
        projectId: 'proj-ucs531-team04',
        projectName: 'CloudForge Serverless Workspace',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        action: 'FILE_SHARED',
        actor: 'Aditya Gupta',
        actorEmail: 'agupta5_be24@thapar.edu',
        details: "Generated 24-hour temporary pre-signed link for 'system_architecture_spec.pdf'.",
        fileName: 'system_architecture_spec.pdf'
      },
      {
        id: 'act-4',
        projectId: 'proj-ucs531-team04',
        projectName: 'CloudForge Serverless Workspace',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        action: 'MEMBER_INVITED',
        actor: 'Gagandeep Kaur',
        actorEmail: 'gkaur10_be24@thapar.edu',
        details: "Invited Aditya Gupta (agupta5_be24@thapar.edu) as Editor.",
        fileName: '-'
      },
      {
        id: 'act-5',
        projectId: 'proj-distributed-db',
        projectName: 'Distributed Key-Value Store with Raft',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        action: 'SNAPSHOT_CREATED',
        actor: 'Puneet Singh',
        actorEmail: 'psingh18_be24@thapar.edu',
        details: "Created final academic submission snapshot 'Final Academic Submission v1.0'.",
        fileName: 'final_submission.zip'
      },
      {
        id: 'act-6',
        projectId: 'proj-ucs531-team04',
        projectName: 'CloudForge Serverless Workspace',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        action: 'PROJECT_CREATED',
        actor: 'Gagandeep Kaur',
        actorEmail: 'gkaur10_be24@thapar.edu',
        details: "Project 'CloudForge Serverless Workspace' initialized.",
        fileName: '-'
      }
    ]
  };

  saveMockDb(initialDb);
  return initialDb;
}

export function saveMockDb(db) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
}

// =============================================================================
// Unified API Interface
// =============================================================================
export const api = {
  // --- Projects ---
  async getProjects() {
    if (authService.isMockMode()) {
      await new Promise((r) => setTimeout(r, 100));
      const db = getMockDb();
      return { data: { projects: db.projects } };
    }
    return apiClient.get('/projects');
  },

  async getProjectDetails(projectId) {
    if (authService.isMockMode()) {
      await new Promise((r) => setTimeout(r, 80));
      const db = getMockDb();
      const project = db.projects.find((p) => p.projectId === projectId);
      if (!project) throw new Error('Project not found');
      return { data: project };
    }
    return apiClient.get(`/projects/${projectId}`);
  },

  async createProject(data) {
    if (authService.isMockMode()) {
      await new Promise((r) => setTimeout(r, 150));
      const db = getMockDb();
      const user = authService.getCurrentUser();
      const newProj = {
        projectId: `proj-${Math.random().toString(36).substring(2, 9)}`,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        category: data.category || 'General',
        visibility: data.visibility || 'Team Shared',
        status: 'In Progress',
        ownerEmail: user.email,
        members: [
          {
            email: user.email,
            name: user.name,
            role: 'Admin',
            joinedDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            avatar: user.avatar || user.name?.substring(0, 2).toUpperCase()
          }
        ],
        totalStorageBytes: 0,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        snapshotStatus: 'NONE'
      };

      db.projects.unshift(newProj);
      db.folders[newProj.projectId] = ['Source Code', 'Datasets', 'Reports', 'Documentation', 'Presentations'];
      db.files[newProj.projectId] = [];

      db.activities.unshift({
        id: `act-${Date.now()}`,
        projectId: newProj.projectId,
        projectName: newProj.title,
        timestamp: new Date().toISOString(),
        action: 'PROJECT_CREATED',
        actor: user.name,
        actorEmail: user.email,
        details: `Project '${newProj.title}' created in category '${newProj.category}'.`,
        fileName: '-'
      });

      saveMockDb(db);
      return { data: newProj };
    }
    return apiClient.post('/projects', data);
  },

  async updateProject(projectId, updates) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const proj = db.projects.find((p) => p.projectId === projectId);
      if (proj) {
        Object.assign(proj, updates, { lastModified: new Date().toISOString() });
        saveMockDb(db);
      }
      return { data: proj };
    }
    return apiClient.put(`/projects/${projectId}`, updates);
  },

  async deleteProject(projectId) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      db.projects = db.projects.filter((p) => p.projectId !== projectId);
      delete db.folders[projectId];
      delete db.files[projectId];
      saveMockDb(db);
      return { data: { success: true } };
    }
    return apiClient.delete(`/projects/${projectId}`);
  },

  // --- Folders ---
  async getFolders(projectId) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      return { data: { folders: db.folders[projectId] || ['Source Code', 'Datasets', 'Reports', 'Documentation', 'Presentations'] } };
    }
    return { data: { folders: ['Source Code', 'Datasets', 'Reports', 'Documentation', 'Presentations'] } };
  },

  async createFolder(projectId, folderName) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      if (!db.folders[projectId]) db.folders[projectId] = [];
      if (!db.folders[projectId].includes(folderName)) {
        db.folders[projectId].push(folderName);
      }
      saveMockDb(db);
      return { data: { folders: db.folders[projectId] } };
    }
    return { data: { success: true, folderName } };
  },

  async deleteFolder(projectId, folderName) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      if (db.folders[projectId]) {
        db.folders[projectId] = db.folders[projectId].filter((f) => f !== folderName);
        if (db.files[projectId]) {
          db.files[projectId] = db.files[projectId].filter((f) => f.folder !== folderName);
        }
      }
      saveMockDb(db);
      return { data: { success: true } };
    }
    return { data: { success: true } };
  },

  // --- Files & S3 Upload ---
  async getFiles(projectId) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      return { data: { files: db.files[projectId] || [] } };
    }
    return apiClient.get(`/projects/${projectId}/files`);
  },

  async getUploadUrl(projectId, fileName, fileType = 'application/octet-stream', category = 'General') {
    if (authService.isMockMode()) {
      return {
        data: {
          uploadUrl: `https://mock-s3.amazonaws.com/projects/${projectId}/${encodeURIComponent(fileName)}`,
          s3Key: `projects/${projectId}/${fileName}`,
          expiresIn: 300,
          fileName
        }
      };
    }
    return apiClient.post(`/projects/${projectId}/upload-url`, { fileName, fileType, category });
  },

  async uploadFileToS3(uploadUrl, file, onProgress) {
    if (authService.isMockMode()) {
      for (let p = 15; p <= 100; p += 25) {
        await new Promise((r) => setTimeout(r, 60));
        if (onProgress) onProgress({ loaded: p, total: 100, percent: p });
      }
      return { status: 200, statusText: 'OK' };
    }
    return axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({ loaded: progressEvent.loaded, total: progressEvent.total, percent });
        }
      }
    });
  },

  async registerUploadedFile(projectId, file, folder = 'Source Code') {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const user = authService.getCurrentUser();
      if (!db.files[projectId]) db.files[projectId] = [];

      const ext = file.name.split('.').pop().toLowerCase();
      let fileType = 'file';
      if (['py', 'js', 'ts', 'jsx', 'html', 'css', 'java', 'cpp'].includes(ext)) fileType = 'code';
      else if (['csv', 'json', 'parquet', 'xlsx'].includes(ext)) fileType = 'dataset';
      else if (['pdf', 'docx', 'doc', 'txt', 'md'].includes(ext)) fileType = 'document';
      else if (['pptx', 'ppt', 'key'].includes(ext)) fileType = 'presentation';

      const existing = db.files[projectId].find((f) => f.fileName === file.name && f.folder === folder);
      const newVersionId = `s3-ver-${Math.random().toString(36).substring(2, 9)}`;

      if (existing) {
        existing.lastModified = new Date().toISOString();
        existing.sizeBytes = file.size;
        existing.versionCount = (existing.versionCount || 1) + 1;
      } else {
        db.files[projectId].unshift({
          fileId: `f-${Date.now()}`,
          fileName: file.name,
          folder: folder,
          fileType: ext,
          sizeBytes: file.size,
          uploadedBy: user.email,
          uploadedDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          versionCount: 1,
          content: `Simulated contents of ${file.name} uploaded on AWS S3 Versioning.`
        });
      }

      // Record in versions
      const key = `${projectId}/${file.name}`;
      if (!db.versions[key]) db.versions[key] = [];
      db.versions[key].forEach((v) => (v.isLatest = false));
      db.versions[key].unshift({
        versionNumber: `v${db.versions[key].length + 1}`,
        versionId: newVersionId,
        isLatest: true,
        modifiedDate: new Date().toISOString(),
        sizeBytes: file.size,
        modifiedBy: user.email,
        notes: `Direct upload to folder '${folder}'`
      });

      // Update storage
      const proj = db.projects.find((p) => p.projectId === projectId);
      if (proj) {
        proj.totalStorageBytes = (proj.totalStorageBytes || 0) + file.size;
        proj.lastModified = new Date().toISOString();
      }

      // Activity log
      db.activities.unshift({
        id: `act-${Date.now()}`,
        projectId,
        projectName: proj ? proj.title : projectId,
        timestamp: new Date().toISOString(),
        action: 'FILE_UPLOADED',
        actor: user.name,
        actorEmail: user.email,
        details: `Uploaded '${file.name}' (${Math.round(file.size / 1024)} KB) to folder '${folder}'.`,
        fileName: file.name
      });

      saveMockDb(db);
      return { success: true };
    }
  },

  async deleteFile(projectId, fileId) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const user = authService.getCurrentUser();
      const proj = db.projects.find((p) => p.projectId === projectId);
      if (db.files[projectId]) {
        const file = db.files[projectId].find((f) => f.fileId === fileId);
        db.files[projectId] = db.files[projectId].filter((f) => f.fileId !== fileId);
        if (file && proj) {
          proj.totalStorageBytes = Math.max(0, (proj.totalStorageBytes || 0) - file.sizeBytes);
          db.activities.unshift({
            id: `act-${Date.now()}`,
            projectId,
            projectName: proj.title,
            timestamp: new Date().toISOString(),
            action: 'FILE_DELETED',
            actor: user.name,
            actorEmail: user.email,
            details: `Deleted file '${file.fileName}' from folder '${file.folder}'.`,
            fileName: file.fileName
          });
        }
      }
      saveMockDb(db);
      return { data: { success: true } };
    }
    return apiClient.delete(`/projects/${projectId}/files/${fileId}`);
  },

  async renameFile(projectId, fileId, newName) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const user = authService.getCurrentUser();
      const proj = db.projects.find((p) => p.projectId === projectId);
      if (db.files[projectId]) {
        const file = db.files[projectId].find((f) => f.fileId === fileId);
        if (file) {
          const oldName = file.fileName;
          file.fileName = newName;
          file.lastModified = new Date().toISOString();
          db.activities.unshift({
            id: `act-${Date.now()}`,
            projectId,
            projectName: proj ? proj.title : projectId,
            timestamp: new Date().toISOString(),
            action: 'FILE_UPDATED',
            actor: user.name,
            actorEmail: user.email,
            details: `Renamed '${oldName}' to '${newName}'.`,
            fileName: newName
          });
        }
      }
      saveMockDb(db);
      return { data: { success: true } };
    }
    return { data: { success: true } };
  },

  // --- Version History & Recovery ---
  async getVersions(projectId, fileName) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const key = `${projectId}/${fileName}`;
      const list = db.versions[key] || [
        {
          versionNumber: 'v1',
          versionId: 's3-ver-orig-1',
          isLatest: true,
          modifiedDate: new Date().toISOString(),
          sizeBytes: 25000,
          modifiedBy: 'Team Member',
          notes: 'Initial S3 version record'
        }
      ];
      return { data: { fileName, versions: list } };
    }
    return apiClient.get(`/projects/${projectId}/files/${encodeURIComponent(fileName)}/versions`);
  },

  async restoreVersion(projectId, fileName, versionId) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const user = authService.getCurrentUser();
      const key = `${projectId}/${fileName}`;
      const list = db.versions[key] || [];
      const target = list.find((v) => v.versionId === versionId);

      const restoredId = `s3-ver-restored-${Math.random().toString(36).substring(2, 9)}`;
      list.forEach((v) => (v.isLatest = false));
      list.unshift({
        versionNumber: `v${list.length + 1}`,
        versionId: restoredId,
        isLatest: true,
        modifiedDate: new Date().toISOString(),
        sizeBytes: target ? target.sizeBytes : 20000,
        modifiedBy: user.email,
        notes: `Restored point-in-time from ${versionId.substring(0, 10)}... via s3:CopyObject`
      });

      const proj = db.projects.find((p) => p.projectId === projectId);
      db.activities.unshift({
        id: `act-${Date.now()}`,
        projectId,
        projectName: proj ? proj.title : projectId,
        timestamp: new Date().toISOString(),
        action: 'VERSION_RESTORED',
        actor: user.name,
        actorEmail: user.email,
        details: `Restored '${fileName}' to version ${target?.versionNumber || versionId}.`,
        fileName
      });

      saveMockDb(db);
      return { data: { success: true, newVersionId: restoredId } };
    }
    return apiClient.post(`/projects/${projectId}/files/${encodeURIComponent(fileName)}/recover`, { versionId });
  },

  // --- File Sharing ---
  async getSharedLinks() {
    if (authService.isMockMode()) {
      const db = getMockDb();
      return { data: { sharedLinks: db.sharedLinks || [] } };
    }
    return { data: { sharedLinks: [] } };
  },

  async createShareLink(data) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const user = authService.getCurrentUser();
      const linkId = `link-${Math.random().toString(36).substring(2, 8)}`;
      const expHours = data.expiryHours || 24;
      const expDate = new Date(Date.now() + expHours * 3600000).toISOString();
      const token = Math.random().toString(36).substring(2, 16);

      const newLink = {
        linkId,
        projectId: data.projectId,
        projectName: data.projectName || 'Project',
        fileName: data.fileName,
        sharedBy: user.email,
        permission: data.permission || 'Download Access',
        createdDate: new Date().toISOString(),
        expirationDate: expDate,
        status: 'Active',
        shareUrl: `https://cloudforge.workspace/share/${token}?id=${linkId}`
      };

      if (!db.sharedLinks) db.sharedLinks = [];
      db.sharedLinks.unshift(newLink);

      db.activities.unshift({
        id: `act-${Date.now()}`,
        projectId: data.projectId,
        projectName: data.projectName,
        timestamp: new Date().toISOString(),
        action: 'FILE_SHARED',
        actor: user.name,
        actorEmail: user.email,
        details: `Generated temporary ${data.permission} link for '${data.fileName}' (Expires in ${expHours}h).`,
        fileName: data.fileName
      });

      saveMockDb(db);
      return { data: newLink };
    }
    return apiClient.post(`/projects/${data.projectId}/files/${encodeURIComponent(data.fileName)}/share`, data);
  },

  async revokeShareLink(linkId) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const link = db.sharedLinks?.find((l) => l.linkId === linkId);
      if (link) {
        link.status = 'Revoked';
      }
      saveMockDb(db);
      return { data: { success: true } };
    }
    return { data: { success: true } };
  },

  // --- Team Members & Permissions ---
  async getTeamMembers(projectId) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const proj = db.projects.find((p) => p.projectId === projectId);
      return { data: { members: proj ? proj.members : [] } };
    }
    return apiClient.get(`/projects/${projectId}/members`);
  },

  async inviteMember(projectId, email, role = 'Editor') {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const user = authService.getCurrentUser();
      const proj = db.projects.find((p) => p.projectId === projectId);
      if (proj) {
        if (!proj.members) proj.members = [];
        const existing = proj.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          existing.role = role;
        } else {
          const name = email.split('@')[0].replace(/[._]/g, ' ');
          proj.members.push({
            email,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            role,
            joinedDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            avatar: email.substring(0, 2).toUpperCase()
          });
        }

        db.activities.unshift({
          id: `act-${Date.now()}`,
          projectId,
          projectName: proj.title,
          timestamp: new Date().toISOString(),
          action: 'MEMBER_INVITED',
          actor: user.name,
          actorEmail: user.email,
          details: `Invited ${email} as ${role} in project '${proj.title}'.`,
          fileName: '-'
        });

        saveMockDb(db);
        return { data: { success: true, members: proj.members } };
      }
    }
    return apiClient.post(`/projects/${projectId}/members`, { email, role });
  },

  async updateMemberRole(projectId, email, newRole) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const user = authService.getCurrentUser();
      const proj = db.projects.find((p) => p.projectId === projectId);
      if (proj && proj.members) {
        const member = proj.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
        if (member) {
          const oldRole = member.role;
          member.role = newRole;
          db.activities.unshift({
            id: `act-${Date.now()}`,
            projectId,
            projectName: proj.title,
            timestamp: new Date().toISOString(),
            action: 'PERMISSION_CHANGED',
            actor: user.name,
            actorEmail: user.email,
            details: `Changed role of ${email} from ${oldRole} to ${newRole}.`,
            fileName: '-'
          });
        }
      }
      saveMockDb(db);
      return { data: { success: true } };
    }
    return { data: { success: true } };
  },

  async removeMember(projectId, email) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const proj = db.projects.find((p) => p.projectId === projectId);
      if (proj && proj.members) {
        proj.members = proj.members.filter((m) => m.email.toLowerCase() !== email.toLowerCase());
      }
      saveMockDb(db);
      return { data: { success: true } };
    }
    return { data: { success: true } };
  },

  // --- Activity Logs ---
  async getActivityLogs() {
    if (authService.isMockMode()) {
      const db = getMockDb();
      return { data: { activities: db.activities || [] } };
    }
    return apiClient.get('/activities');
  },

  // --- Submissions & Snapshots ---
  async getSnapshots() {
    if (authService.isMockMode()) {
      const db = getMockDb();
      return { data: { snapshots: db.snapshots || [] } };
    }
    return { data: { snapshots: [] } };
  },

  async createSnapshot(data) {
    if (authService.isMockMode()) {
      const db = getMockDb();
      const user = authService.getCurrentUser();
      const proj = db.projects.find((p) => p.projectId === data.projectId);
      const snapshotId = `snap-${Math.random().toString(36).substring(2, 7)}`;
      const timeSlug = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 15);
      const filesCount = (db.files[data.projectId] || []).length;

      const newSnap = {
        snapshotId,
        snapshotName: data.snapshotName || 'Final Academic Submission',
        projectId: data.projectId,
        projectName: proj ? proj.title : data.projectId,
        description: data.description || 'Submission package created on AWS S3.',
        createdBy: user.email,
        createdDate: new Date().toISOString(),
        fileCount: filesCount,
        status: 'Submitted',
        s3Prefix: `snapshots/${data.projectId}/${timeSlug}/`,
        zipKey: `final_submission_${data.projectId}.zip`,
        downloadUrl: `https://cloudforge-storage.s3.amazonaws.com/snapshots/${data.projectId}/final_submission_${data.projectId}.zip`
      };

      if (!db.snapshots) db.snapshots = [];
      db.snapshots.unshift(newSnap);

      if (proj) {
        proj.snapshotStatus = 'SUBMITTED';
        proj.status = 'Submitted';
      }

      db.activities.unshift({
        id: `act-${Date.now()}`,
        projectId: data.projectId,
        projectName: proj ? proj.title : data.projectId,
        timestamp: new Date().toISOString(),
        action: 'SNAPSHOT_CREATED',
        actor: user.name,
        actorEmail: user.email,
        details: `Created submission snapshot '${newSnap.snapshotName}' with ${filesCount} files bundled.`,
        fileName: newSnap.zipKey
      });

      saveMockDb(db);
      return { data: newSnap };
    }
    return apiClient.post(`/projects/${data.projectId}/snapshot`, data);
  },

  async getBackupInfo() {
    if (authService.isMockMode()) {
      const db = getMockDb();
      return { data: db.backup };
    }
    return { data: { status: 'Healthy', lastBackupDate: new Date().toISOString() } };
  },

  async restoreBackup(backupId) {
    if (authService.isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      return { data: { success: true, message: `Backup ${backupId} successfully restored from AWS Backup Vault.` } };
    }
    return { data: { success: true } };
  }
};
