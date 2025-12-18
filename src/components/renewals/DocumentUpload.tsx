/**
 * DocumentUpload Component
 * Drag-drop upload with document type selection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, File, FileText, Trash2, Download, Eye, FolderOpen, X, CheckCircle, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, Document } from '@/services/api';
import { toast } from 'sonner';

interface DocumentAnalysis {
  documentType: string;
  overview: string;
  keyInformation: { label: string; value: string }[];
  coverageDetails?: { limits: string; deductible: string; exclusions: string[] };
  riskFactors: { level: string; description: string }[];
  actionItems: { priority: string; action: string; deadline: string | null }[];
  summaryPoints: string[];
  confidence: number;
}

interface DocumentUploadProps {
  renewalId?: string;
  clientId?: string;
  policyId?: string;
  quoteId?: string;
  onUpload?: (document: Document) => void;
  renewalContext?: { clientName: string; policyType: string; premium: number };
  onDocumentAnalyzed?: (docId: string, analysis: DocumentAnalysis) => void;
}

const documentTypes = [
  { value: 'POLICY', label: 'Policy', icon: FileText, color: 'text-blue-500' },
  { value: 'QUOTE', label: 'Quote', icon: File, color: 'text-green-500' },
  { value: 'LOSS_RUN', label: 'Loss Run', icon: FileText, color: 'text-orange-500' },
  { value: 'APPLICATION', label: 'Application', icon: File, color: 'text-purple-500' },
  { value: 'CERTIFICATE', label: 'Certificate', icon: FileText, color: 'text-cyan-500' },
  { value: 'ENDORSEMENT', label: 'Endorsement', icon: File, color: 'text-pink-500' },
  { value: 'INVOICE', label: 'Invoice', icon: FileText, color: 'text-yellow-500' },
  { value: 'CLAIM', label: 'Claim', icon: File, color: 'text-red-500' },
  { value: 'CORRESPONDENCE', label: 'Correspondence', icon: FileText, color: 'text-slate-500' },
  { value: 'OTHER', label: 'Other', icon: File, color: 'text-gray-500' },
];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  const docType = documentTypes.find(t => t.value === type);
  return docType || documentTypes[documentTypes.length - 1];
};

export function DocumentUpload({ renewalId, clientId, policyId, quoteId, onUpload, renewalContext, onDocumentAnalyzed }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groupedDocs, setGroupedDocs] = useState<Record<string, Document[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ file: File; progress: number; type: string }[]>([]);
  const [selectedType, setSelectedType] = useState('OTHER');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, DocumentAnalysis>>({});
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [renewalId, clientId, policyId]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      let response;

      if (renewalId) {
        response = await api.getRenewalDocuments(renewalId);
        if (response.data) {
          setDocuments(response.data.documents);
          setGroupedDocs(response.data.grouped);
        }
      } else {
        response = await api.getDocuments({ clientId, policyId });
        if (response.data) {
          setDocuments(response.data.documents);
          // Group manually
          const grouped = response.data.documents.reduce((acc: Record<string, Document[]>, doc) => {
            if (!acc[doc.type]) acc[doc.type] = [];
            acc[doc.type].push(doc);
            return acc;
          }, {});
          setGroupedDocs(grouped);
        }
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setShowTypeSelector(true);
      // Store files temporarily
      setUploadingFiles(files.map(f => ({ file: f, progress: 0, type: selectedType })));
    }
  }, [selectedType]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setShowTypeSelector(true);
      setUploadingFiles(files.map(f => ({ file: f, progress: 0, type: selectedType })));
    }
  };

  const uploadFiles = async () => {
    setShowTypeSelector(false);

    for (const { file } of uploadingFiles) {
      try {
        // Read file as base64
        const reader = new FileReader();
        const content = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Extract base64 content (remove data URL prefix)
        const base64Content = content.split(',')[1];

        await api.uploadDocument({
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for name
          originalName: file.name,
          type: selectedType,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          content: base64Content,
          renewalId,
          clientId,
          policyId,
          quoteId,
        });

        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploadingFiles([]);
    await fetchDocuments();
  };

  const handleDelete = async (documentId: string, documentName: string) => {
    if (!confirm(`Delete "${documentName}"?`)) return;

    try {
      await api.deleteDocument(documentId);
      await fetchDocuments();
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const cancelUpload = () => {
    setUploadingFiles([]);
    setShowTypeSelector(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeDocument = async (doc: Document) => {
    try {
      setAnalyzingDoc(doc.id);

      // For text-based documents, we'd extract text. For now, use document metadata
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ai/analyze-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentName: doc.name,
          documentType: doc.type,
          content: `Document: ${doc.name}\nType: ${doc.type}\nOriginal File: ${doc.originalName}\nSize: ${formatFileSize(doc.size)}\nUploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}`,
          renewalContext,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      const analysis = data.analysis;
      setAnalyses(prev => ({ ...prev, [doc.id]: analysis }));
      setExpandedAnalysis(doc.id);

      // Notify parent component of the analysis
      if (onDocumentAnalyzed) {
        onDocumentAnalyzed(doc.id, {
          ...analysis,
          documentName: doc.name,
          documentType: doc.type,
        });
      }

      toast.success(`Analyzed ${doc.name}`);
    } catch (error) {
      console.error('Failed to analyze document:', error);
      toast.error('Failed to analyze document');
    } finally {
      setAnalyzingDoc(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-secondary rounded border-2 border-dashed"></div>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-secondary rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card
        className={cn(
          'relative border-2 border-dashed transition-all cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
        />

        <div className="p-8 text-center">
          <Upload className={cn(
            'h-10 w-10 mx-auto mb-3 transition-colors',
            isDragging ? 'text-primary' : 'text-muted-foreground'
          )} />
          <p className="font-medium mb-1">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse • PDF, Word, Excel, Images
          </p>
        </div>
      </Card>

      {/* Type Selector Modal */}
      {showTypeSelector && uploadingFiles.length > 0 && (
        <Card className="p-4 border-2 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">
              Upload {uploadingFiles.length} file{uploadingFiles.length > 1 ? 's' : ''}
            </h4>
            <button onClick={cancelUpload} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Files Preview */}
          <div className="space-y-2 mb-4">
            {uploadingFiles.map(({ file }, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-background rounded border">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>

          {/* Type Selection */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Document Type:</label>
            <div className="grid grid-cols-5 gap-2">
              {documentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={cn(
                      'p-2 rounded border text-center transition-all',
                      selectedType === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-muted hover:bg-muted/80'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 mx-auto mb-1', type.color)} />
                    <span className="text-xs">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={uploadFiles} className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Upload as {documentTypes.find(t => t.value === selectedType)?.label}
            </Button>
            <Button variant="ghost" onClick={cancelUpload}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Documents List Grouped by Type */}
      {documents.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedDocs).map(([type, docs]) => {
            const typeConfig = getFileIcon(type);
            const Icon = typeConfig.icon;

            return (
              <Card key={type} className="overflow-hidden">
                <div className="p-3 bg-muted/30 border-b flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', typeConfig.color)} />
                  <span className="font-medium text-sm">{typeConfig.label}</span>
                  <Badge variant="secondary" className="text-xs">{docs.length}</Badge>
                </div>
                <div className="divide-y">
                  {docs.map((doc) => (
                    <div key={doc.id} className="border-b last:border-b-0">
                      <div className="p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <FileText className={cn('h-5 w-5', typeConfig.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.originalName} • {formatFileSize(doc.size)}
                            {doc.version > 1 && ` • v${doc.version}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-primary"
                            onClick={() => analyzeDocument(doc)}
                            disabled={analyzingDoc === doc.id}
                          >
                            {analyzingDoc === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            <span className="ml-1 text-xs">Analyze</span>
                          </Button>
                          {analyses[doc.id] && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setExpandedAnalysis(expandedAnalysis === doc.id ? null : doc.id)}
                            >
                              {expandedAnalysis === doc.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(doc.id, doc.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Analysis Results */}
                      {analyses[doc.id] && expandedAnalysis === doc.id && (
                        <div className="px-4 pb-4 pt-2 bg-primary/5 border-t">
                          <div className="space-y-4">
                            {/* Confidence Badge */}
                            <div className="flex items-center gap-2">
                              <Badge variant={analyses[doc.id].confidence >= 80 ? 'default' : 'secondary'}>
                                {analyses[doc.id].confidence}% Confidence
                              </Badge>
                              <span className="text-xs text-muted-foreground">AI Analysis</span>
                            </div>

                            {/* Overview */}
                            <div>
                              <h5 className="font-medium text-sm mb-1">Document Overview</h5>
                              <p className="text-sm text-muted-foreground">{analyses[doc.id].overview}</p>
                            </div>

                            {/* Key Information */}
                            {analyses[doc.id].keyInformation?.length > 0 && (
                              <div>
                                <h5 className="font-medium text-sm mb-2">Key Information</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  {analyses[doc.id].keyInformation.map((info, i) => (
                                    <div key={i} className="bg-background p-2 rounded border">
                                      <p className="text-xs text-muted-foreground">{info.label}</p>
                                      <p className="text-sm font-medium">{info.value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Summary Points */}
                            {analyses[doc.id].summaryPoints?.length > 0 && (
                              <div>
                                <h5 className="font-medium text-sm mb-2">Summary Points</h5>
                                <ul className="space-y-1">
                                  {analyses[doc.id].summaryPoints.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Risk Factors */}
                            {analyses[doc.id].riskFactors?.length > 0 && (
                              <div>
                                <h5 className="font-medium text-sm mb-2">Risk Factors</h5>
                                <div className="space-y-2">
                                  {analyses[doc.id].riskFactors.map((risk, i) => (
                                    <div key={i} className={cn(
                                      'p-2 rounded border-l-4',
                                      risk.level === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                                      risk.level === 'medium' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' :
                                      'border-green-500 bg-green-50 dark:bg-green-950'
                                    )}>
                                      <Badge variant="outline" className="text-xs mb-1">{risk.level}</Badge>
                                      <p className="text-sm">{risk.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Items */}
                            {analyses[doc.id].actionItems?.length > 0 && (
                              <div>
                                <h5 className="font-medium text-sm mb-2">Recommended Actions</h5>
                                <div className="space-y-2">
                                  {analyses[doc.id].actionItems.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 bg-background rounded border">
                                      <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'} className="text-xs shrink-0">
                                        {item.priority}
                                      </Badge>
                                      <div className="flex-1">
                                        <p className="text-sm">{item.action}</p>
                                        {item.deadline && <p className="text-xs text-muted-foreground">Due: {item.deadline}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <FolderOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No documents uploaded yet</p>
        </Card>
      )}
    </div>
  );
}

export default DocumentUpload;
