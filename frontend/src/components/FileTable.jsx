import React from 'react';
import { 
  FileText, 
  Code2, 
  Database, 
  Presentation, 
  File, 
  History, 
  Share2, 
  Download, 
  Clock,
  HardDrive
} from 'lucide-react';

export default function FileTable({ 
  files = [], 
  onViewVersions, 
  onShareFile, 
  onDownloadFile, 
  isLoading = false 
}) {
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Source Code':
        return <Code2 className="w-4 h-4 text-emerald-600" />;
      case 'Dataset':
        return <Database className="w-4 h-4 text-blue-600" />;
      case 'Report & Docs':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'Presentation':
        return <Presentation className="w-4 h-4 text-purple-600" />;
      default:
        return <File className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Source Code':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dataset':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Report & Docs':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Presentation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading files from AWS S3...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white shadow-xs">
        <HardDrive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No project files uploaded yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Drag and drop code, datasets, reports, or slides above to initiate automatic S3 versioning.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
          <tr>
            <th scope="col" className="px-5 py-3.5">File Name</th>
            <th scope="col" className="px-5 py-3.5">Category</th>
            <th scope="col" className="px-5 py-3.5">Size</th>
            <th scope="col" className="px-5 py-3.5">Last Modified</th>
            <th scope="col" className="px-5 py-3.5">Versions</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {files.map((file) => (
            <tr 
              key={file.fileName}
              className="hover:bg-blue-50/30 transition duration-150 group"
            >
              {/* File Name */}
              <td className="px-5 py-4 font-medium text-slate-900 flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50/50 transition">
                  {getCategoryIcon(file.category)}
                </div>
                <div className="truncate max-w-xs md:max-w-sm">
                  <span className="font-mono text-sm font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer"
                        onClick={() => onViewVersions(file)}>
                    {file.fileName}
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Uploaded by {file.uploadedBy || 'Unknown'}
                  </p>
                </div>
              </td>

              {/* Category */}
              <td className="px-5 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(file.category)}`}>
                  {file.category}
                </span>
              </td>

              {/* Size */}
              <td className="px-5 py-4 whitespace-nowrap font-mono text-xs font-medium text-slate-600">
                {formatBytes(file.sizeBytes)}
              </td>

              {/* Last Modified */}
              <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(file.lastModified)}</span>
                </div>
              </td>

              {/* Versions Badge */}
              <td className="px-5 py-4 whitespace-nowrap">
                <button
                  onClick={() => onViewVersions(file)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-xs font-mono font-bold border border-blue-200 transition"
                  title="Click to view full version history & recover"
                >
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>{file.versionCount > 1 ? `${file.versionCount} versions` : 'v1'}</span>
                </button>
              </td>

              {/* Actions */}
              <td className="px-5 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-1.5">
                  <button
                    onClick={() => onShareFile(file)}
                    title="Generate temporary pre-signed share link"
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onViewVersions(file)}
                    title="Inspect S3 Version History"
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownloadFile(file)}
                    title="Download active version"
                    className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
