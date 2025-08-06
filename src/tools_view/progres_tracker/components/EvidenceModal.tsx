"use client";

import React, { useState } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Upload, FileText, Image, Download, Trash2 } from "lucide-react";

interface Evidence {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  uploadedAt: string;
  size?: number;
}

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: Evidence[];
  onEvidenceChange: (evidence: Evidence[]) => void;
  processName: string;
}

export function EvidenceModal({ isOpen, onClose, evidence, onEvidenceChange, processName }: EvidenceModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadingFiles(Array.from(files).map(f => f.name));

    try {
      const newEvidence: Evidence[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = generateId();
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + (100 / files.length);
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return newProgress;
          });
        }, 100);
        
        // Create a blob URL for the file
        const blobUrl = URL.createObjectURL(file);
        
        const evidenceItem: Evidence = {
          id: fileId,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: blobUrl,
          uploadedAt: new Date().toISOString(),
          size: file.size
        };
        
        newEvidence.push(evidenceItem);
        
        // Wait a bit to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      onEvidenceChange([...evidence, ...newEvidence]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadingFiles([]);
    }
  };

  const handleDeleteEvidence = (evidenceId: string) => {
    const evidenceToDelete = evidence.find(e => e.id === evidenceId);
    if (evidenceToDelete) {
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(evidenceToDelete.url);
    }
    // Immediately remove from evidence list
    const updatedEvidence = evidence.filter(e => e.id !== evidenceId);
    onEvidenceChange(updatedEvidence);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-sm sm:max-w-md lg:max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl text-white">Evidence for {processName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Upload Section */}
          <div className="border border-gray-600 rounded-lg p-3 sm:p-4 bg-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Upload Evidence</h3>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="evidence-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="evidence-upload"
                  className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg cursor-pointer transition-colors w-full sm:w-auto ${
                    uploading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm sm:text-base">{uploading ? 'Uploading...' : 'Upload Files'}</span>
                </label>
              </div>
            </div>
            
            {/* Upload Progress Bar */}
            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-400">
                    Uploading {uploadingFiles.length} file(s)...
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-blue-400">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {uploadingFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Files being uploaded:</p>
                    <div className="space-y-1">
                      {uploadingFiles.map((fileName, index) => (
                        <div key={index} className="text-xs text-gray-400 flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            (index + 1) * (100 / uploadingFiles.length) <= uploadProgress 
                              ? 'bg-green-500' 
                              : 'bg-gray-500'
                          }`} />
                          <span className="truncate">{fileName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs sm:text-sm text-gray-400">
              Supported formats: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX, XLS, XLSX), Text files
            </p>
          </div>

          {/* Evidence List */}
          {evidence.length > 0 && (
            <div className="border border-gray-600 rounded-lg p-3 sm:p-4 bg-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Uploaded Evidence ({evidence.length})</h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {evidence.map((item) => (
                  <div key={item.id} className="bg-gray-600 rounded-lg p-3 border border-gray-500 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        {item.type === 'image' ? (
                          <Image className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
                        ) : (
                          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-white truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(item.size)} • {new Date(item.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.url, '_blank')}
                          className="text-blue-400 hover:text-white p-1 sm:p-2"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvidence(item.id)}
                          className="text-red-400 hover:text-white transition-transform duration-150 p-1 sm:p-2"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Image Preview */}
                    {item.type === 'image' && (
                      <div className="mt-3">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-24 sm:h-32 object-cover rounded border border-gray-500 transition-all duration-500 ease-in-out opacity-0"
                          onError={(e) => {
                            console.error('Error loading image:', item.url);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={(e) => {
                            // Fade in the image when loaded
                            e.currentTarget.classList.remove('opacity-0');
                            e.currentTarget.classList.add('opacity-100');
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 