"use client";

import React, { useState } from "react";
import { uploadEvidence, deleteEvidence, getProcessEvidence } from "../../../services/API_Services";
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
  processId?: string;
  subProcessId?: string;
  partId?: string;
  categoryId?: string;
}

export function EvidenceModal({ isOpen, onClose, evidence, onEvidenceChange, processName, processId, subProcessId, partId, categoryId }: EvidenceModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [currentEvidence, setCurrentEvidence] = useState<Evidence[]>(evidence);

  // Load evidence from database when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const loadEvidence = async () => {
        try {
          const targetProcessId = subProcessId || processId;
          if (targetProcessId) {
            const res = await getProcessEvidence(targetProcessId);
            const list = res?.data || res?.evidence || [];
            if (Array.isArray(list)) {
              setCurrentEvidence(list);
              onEvidenceChange(list);
            }
          }
        } catch (error) {
          console.error('Failed to load evidence:', error);
        }
      };
      loadEvidence();
    }
  }, [isOpen, processId, subProcessId, onEvidenceChange]);

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validasi ukuran file (maksimal 10MB per file)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxFileSize) {
        alert(`File "${files[i].name}" terlalu besar. Maksimal ukuran file adalah 10MB.`);
        event.target.value = '';
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadingFiles(Array.from(files).map(f => f.name));

    try {
      const newEvidence: Evidence[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = generateId();
        const targetProcessId = subProcessId || processId || "";
        
        // Simulate upload progress visual
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
        try {
          const base64 = await fileToBase64(file);
          const payload = {
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
            url: base64,
            size: file.size
          };
          let createdId: string | undefined = undefined;
          if (targetProcessId) {
            try {
              // Tambahkan data tambahan untuk tabel baru
              const enhancedPayload = {
                ...payload,
                partId,
                categoryId,
                subProcessId: subProcessId || null
              };
              const resp = await uploadEvidence(targetProcessId, enhancedPayload);
              createdId = resp?.data?.id || resp?.data?.evidenceId || resp?.id || undefined;
            } catch (err) {
              console.error('Upload evidence to backend failed:', err);
            }
          }
          const evidenceItem: Evidence = {
            id: createdId || fileId,
            name: file.name,
            type: payload.type,
            url: payload.url,
            uploadedAt: new Date().toISOString(),
            size: file.size
          };
          newEvidence.push(evidenceItem);
        } finally {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      const updatedEvidence = [...currentEvidence, ...newEvidence];
      setCurrentEvidence(updatedEvidence);
      onEvidenceChange(updatedEvidence);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadingFiles([]);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    try {
      // Hapus dari backend bila mungkin
      try { await deleteEvidence(evidenceId); } catch {}
      const evidenceToDelete = currentEvidence.find(e => e.id === evidenceId);
      if (evidenceToDelete && evidenceToDelete.url?.startsWith('blob:')) {
        URL.revokeObjectURL(evidenceToDelete.url);
      }
      const updatedEvidence = currentEvidence.filter(e => e.id !== evidenceId);
      setCurrentEvidence(updatedEvidence);
      onEvidenceChange(updatedEvidence);
    } catch (err) {
      console.error('Delete evidence failed:', err);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white w-[92vw] max-w-sm sm:max-w-md lg:max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl mx-auto">
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
              <br />
              <span className="text-yellow-400">Maximum file size: 10MB per file</span>
            </p>
          </div>

          {/* Evidence List */}
                      {currentEvidence.length > 0 && (
              <div className="border border-gray-600 rounded-lg p-3 sm:p-4 bg-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Uploaded Evidence ({currentEvidence.length})</h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {currentEvidence.map((item) => (
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
                        {item.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(item.url, '_blank')}
                            className="text-blue-400 hover:text-white p-1 sm:p-2"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
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
                    
                    {/* No image preview as requested; textual description only */}
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