import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  UploadCloud, 
  FolderPlus, 
  Search, 
  Grid, 
  List, 
  Folder, 
  FileText, 
  Code2, 
  Database, 
  Presentation, 
  File, 
  Eye, 
  Download, 
  Edit3, 
  Share2, 
  History, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  HardDrive,
  Users,
  Archive,
  MoreVertical,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import CreateFolderModal from '../components/CreateFolderModal';
import FilePreviewModal from '../components/FilePreviewModal';
import RenameModal from '../components/RenameModal';
import ShareModal from '../components/ShareModal';
import VersionModal from '../components/VersionModal';
import SnapshotModal from '../components/SnapshotModal';

export default function ProjectWorkspace({ project, currentUser, onBack }) {
  const [projectData, setProjectData] = useState(project);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('All'); // 'All' or specific folder name
  const [files, setFiles] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [fileSearch, setFileSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Modals state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null); // { type: 'file'|'folder', id, name }
  const [shareFile, setShareFile] = useState(null);
  const [versionFile, setVersionFile] = useState(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  useEffect(() => {
    if (project?.projectId) {
      loadWorkspace();
    }
  }, [project?.projectId]);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const pRes = await api.getProjectDetails(project.projectId);
      setProjectData(pRes.data);

      const filesRes = await api.getFiles(project.projectId);
      const projectFiles = filesRes.data.files || [];
      setFiles(projectFiles);
      setFolders([...new Set(projectFiles.map((file) => file.folder || file.category).filter(Boolean))]);
    } catch (error) {
      setUploadStatus({ type: 'error', text: error.message || 'Failed to load project workspace.' });
    } finally {
      setLoading(false);
    }
  };

  // Upload handler
  const handleUpload = async (file) => {
    if (!file) return;
    const targetFolder = currentFolder === 'All' ? 'Source Code' : currentFolder;

    setUploadProgress({ fileName: file.name, percent: 10 });
    setUploadStatus(null);

    try {
      const urlRes = await api.getUploadUrl(project.projectId, file.name, file.type, targetFolder);
      const { uploadUrl, uploadHeaders } = urlRes.data;

      await api.uploadFileToS3(uploadUrl, file, (progress) => {
        setUploadProgress({ fileName: file.name, percent: progress.percent });
      }, uploadHeaders);

      setUploadStatus({
        type: 'success',
        text: `File '${file.name}' was uploaded to Amazon S3.`
      });

      await loadWorkspace();
    } catch (err) {
      setUploadStatus({
        type: 'error',
        text: err.response?.data?.detail || err.message || `Failed to upload '${file.name}'.`
      });
    } finally {
      setTimeout(() => setUploadProgress(null), 1500);
    }
  };

  const handleCreateFolder = async (folderName) => {
    try {
      await api.createFolder(project.projectId, folderName);
      await loadWorkspace();
    } catch (error) {
      setUploadStatus({ type: 'error', text: error.message });
    }
  };

  const handleDeleteFolder = async (folderName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete folder '${folderName}' and all files inside?`)) return;
    try {
      await api.deleteFolder(project.projectId, folderName);
      if (currentFolder === folderName) setCurrentFolder('All');
      await loadWorkspace();
    } catch (error) {
      setUploadStatus({ type: 'error', text: error.message });
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!window.confirm('Delete this file from AWS S3 workspace?')) return;
    try {
      await api.deleteFile(project.projectId, fileName);
      await loadWorkspace();
    } catch (error) {
      setUploadStatus({ type: 'error', text: error.message || 'File deletion failed.' });
    }
  };

  const handleRename = async (newName) => {
    if (!renameTarget) return;
    if (renameTarget.type === 'file') {
      try {
        await api.renameFile(project.projectId, renameTarget.id, newName);
        await loadWorkspace();
      } catch (error) {
        setUploadStatus({ type: 'error', text: error.message || 'File rename failed.' });
      }
    }
    setRenameTarget(null);
  };

  const handleDownload = async (file) => {
    try {
      const response = await api.getDownloadUrl(project.projectId, file.fileName);
      window.location.assign(response.data.downloadUrl);
    } catch (err) {
      setUploadStatus({ type: 'error', text: err.response?.data?.detail || err.message || 'Download link generation failed.' });
    }
  };

  // Filter files by folder and search query
  const filteredFiles = files.filter((f) => {
    const matchesFolder = currentFolder === 'All' ? true : (f.folder || f.category) === currentFolder;
    const matchesSearch = f.fileName.toLowerCase().includes(fileSearch.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'python':
      case 'code':
        return <Code2 className="w-4 h-4 text-emerald-600" />;
      case 'csv':
      case 'dataset':
        return <Database className="w-4 h-4 text-blue-600" />;
      case 'pdf':
      case 'document':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'pptx':
      case 'presentation':
        return <Presentation className="w-4 h-4 text-purple-600" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Header & Breadcrumb Navigation */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <button onClick={onBack} className="hover:text-blue-600 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Projects</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-800 font-bold">{projectData.title}</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-sky-600 font-bold">{currentFolder === 'All' ? 'All Files' : currentFolder}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{projectData.title}</h1>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                projectData.snapshotStatus === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                {projectData.snapshotStatus === 'SUBMITTED' ? 'SNAPSHOT CREATED' : 'ACTIVE DEVELOPMENT'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{projectData.description}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSnapshotModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
            >
              <Archive className="w-3.5 h-3.5 text-emerald-600" />
              <span>{projectData.snapshotStatus === 'SUBMITTED' ? 'View Snapshot' : 'Create Final Snapshot'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files[0]);
          }
        }}
        className={`p-6 rounded-3xl border-2 border-dashed transition duration-150 text-center relative ${
          isDragging ? 'border-sky-500 bg-sky-50/70' : 'border-slate-200 hover:border-sky-300 bg-white shadow-2xs'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              Drag & Drop files here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sky-600 hover:text-sky-800 underline font-bold"
              >
                Browse Disk
              </button>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Target folder: <span className="font-bold text-slate-700">{currentFolder === 'All' ? 'Source Code' : currentFolder}</span> • Files stored in Amazon S3
            </p>
          </div>
        </div>

        {uploadProgress && (
          <div className="mt-3 max-w-sm mx-auto space-y-1">
            <div className="flex justify-between text-xs text-slate-500 font-mono">
              <span className="truncate">{uploadProgress.fileName}</span>
              <span>{uploadProgress.percent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${uploadProgress.percent}%` }}></div>
            </div>
          </div>
        )}

        {uploadStatus && (
          <div className={`mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold ${
            uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {uploadStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
            <span>{uploadStatus.text}</span>
          </div>
        )}
      </div>

      {/* 3. Folder Navigation Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentFolder('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              currentFolder === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>All Files</span>
            <span className="text-[10px] font-mono opacity-80">({files.length})</span>
          </button>

          {folders.map((fld) => {
            const count = files.filter(f => f.folder === fld).length;
            const isSelected = currentFolder === fld;
            return (
              <div key={fld} className="flex items-center">
                <button
                  onClick={() => setCurrentFolder(fld)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-sky-50/50 border border-slate-200'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>{fld}</span>
                  <span className="text-[10px] font-mono opacity-80">({count})</span>
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setShowFolderModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-dashed border-slate-300 flex items-center space-x-1"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>New Folder</span>
          </button>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder="Filter files..."
              className="bg-white border border-slate-200 rounded-xl py-1 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 w-44"
            />
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Files List View or Grid View */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Loading files from AWS S3...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white p-8">
          <File className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No files in this folder</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Drag and drop source code, datasets, or documents above to upload directly to S3.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW TABLE */
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3.5">File Name</th>
                <th scope="col" className="px-5 py-3.5">Type</th>
                <th scope="col" className="px-5 py-3.5">Size</th>
                <th scope="col" className="px-5 py-3.5">Uploaded By</th>
                <th scope="col" className="px-5 py-3.5">Upload Date</th>
                <th scope="col" className="px-5 py-3.5">Versions</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.map((file) => (
                <tr key={file.fileId} className="hover:bg-sky-50/20 transition group">
                  <td className="px-5 py-4 font-medium text-slate-900 flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 group-hover:border-sky-300 transition">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div>
                      <span 
                        onClick={() => setPreviewFile(file)}
                        className="font-mono text-sm font-bold text-slate-900 hover:text-sky-600 transition cursor-pointer"
                      >
                        {file.fileName}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-sans">
                        Folder: {file.folder || 'Root'}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                      {file.fileType}
                    </span>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap font-mono text-xs font-medium text-slate-600">
                    {formatBytes(file.sizeBytes)}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-medium truncate max-w-[150px]">
                    {file.uploadedBy?.split('@')[0] || 'Team'}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                    {formatDate(file.uploadedDate || file.lastModified)}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setVersionFile(file)}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-mono font-bold border border-sky-200 transition flex items-center space-x-1"
                    >
                      <History className="w-3 h-3 text-sky-600" />
                      <span>{file.versionCount > 1 ? `${file.versionCount} versions` : 'v1'}</span>
                    </button>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => setPreviewFile(file)}
                        title="Preview File"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        title="Download File"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRenameTarget({ type: 'file', id: file.fileId, name: file.fileName })}
                        title="Rename File"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShareFile(file)}
                        title="Share File"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.fileId)}
                        title="Delete File"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.fileId}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 group-hover:border-sky-300 transition">
                    {getFileIcon(file.fileType)}
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
                    {file.fileType}
                  </span>
                </div>

                <h4 
                  onClick={() => setPreviewFile(file)}
                  className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition truncate cursor-pointer font-mono"
                >
                  {file.fileName}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Folder: {file.folder || 'Root'} • {formatBytes(file.sizeBytes)}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setVersionFile(file)}
                  className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 flex items-center space-x-1"
                >
                  <History className="w-3 h-3 text-sky-600" />
                  <span>{file.versionCount > 1 ? `${file.versionCount} vers` : 'v1'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button onClick={() => setPreviewFile(file)} className="p-1 rounded text-slate-400 hover:text-sky-600">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDownload(file)} className="p-1 rounded text-slate-400 hover:text-emerald-600">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setShareFile(file)} className="p-1 rounded text-slate-400 hover:text-indigo-600">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onCreateFolder={handleCreateFolder}
      />

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDownload={handleDownload}
      />

      <RenameModal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        currentName={renameTarget?.name}
        onRename={handleRename}
      />

      <ShareModal
        isOpen={!!shareFile}
        onClose={() => setShareFile(null)}
        file={shareFile}
        projectId={projectData.projectId}
      />

      <VersionModal
        isOpen={!!versionFile}
        onClose={() => setVersionFile(null)}
        file={versionFile}
        projectId={projectData.projectId}
        onVersionRecovered={loadWorkspace}
      />

      <SnapshotModal
        isOpen={showSnapshotModal}
        onClose={() => setShowSnapshotModal(false)}
        projectId={projectData.projectId}
        projectTitle={projectData.title}
        onSnapshotSuccess={loadWorkspace}
      />
    </div>
  );
}
