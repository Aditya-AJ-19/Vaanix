'use client';

import { useState, useRef } from 'react';
import { useKnowledgeBases, useKnowledgeBase } from '@/hooks/use-knowledge';
import { toast } from 'sonner';

const FILE_TYPE_ICONS: Record<string, string> = {
    pdf: '📄',
    txt: '📝',
    csv: '📊',
    url: '🔗',
    manual: '✏️',
};

const FILE_TYPE_COLORS: Record<string, string> = {
    pdf: 'bg-red-50 text-red-700 border-red-200',
    txt: 'bg-blue-50 text-blue-700 border-blue-200',
    csv: 'bg-green-50 text-green-700 border-green-200',
    url: 'bg-purple-50 text-purple-700 border-purple-200',
    manual: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function KnowledgePage() {
    const [search, setSearch] = useState('');
    const { knowledgeBases, loading, error, createKnowledgeBase, deleteKnowledgeBase } =
        useKnowledgeBases(search || undefined);

    // Create dialog state
    const [showCreate, setShowCreate] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [creating, setCreating] = useState(false);

    // Detail view state
    const [selectedKb, setSelectedKb] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createName.trim()) return;
        try {
            setCreating(true);
            await createKnowledgeBase({ name: createName.trim(), description: createDesc.trim() || undefined });
            toast.success('Knowledge base created');
            setShowCreate(false);
            setCreateName('');
            setCreateDesc('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to create knowledge base');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This will also delete all documents inside it.`)) return;
        try {
            await deleteKnowledgeBase(id);
            toast.success('Knowledge base deleted');
            if (selectedKb === id) setSelectedKb(null);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete knowledge base');
        }
    };

    if (selectedKb) {
        return <KnowledgeBaseDetail kbId={selectedKb} onBack={() => setSelectedKb(null)} />;
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Knowledge Base</h1>
                    <p className="text-surface-500 mt-1">Upload and manage your agent&apos;s knowledge</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                    + New Knowledge Base
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search knowledge bases..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>

            {/* Loading / Error */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Knowledge Bases Grid */}
            {!loading && !error && knowledgeBases.length === 0 && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-surface-200 text-center">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-semibold text-surface-900 mb-2">No knowledge bases yet</h3>
                    <p className="text-surface-500 text-sm mb-6">
                        Create a knowledge base to upload documents and train your agents.
                    </p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                        Create Your First Knowledge Base
                    </button>
                </div>
            )}

            {!loading && !error && knowledgeBases.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {knowledgeBases.map((kb) => (
                        <div
                            key={kb.id}
                            className="bg-white rounded-xl p-5 shadow-sm border border-surface-200 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                            onClick={() => setSelectedKb(kb.id)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">📚</span>
                                    <h3 className="font-semibold text-surface-900 truncate">{kb.name}</h3>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(kb.id, kb.name);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-red-500 transition-all text-sm"
                                >
                                    🗑️
                                </button>
                            </div>
                            {kb.description && (
                                <p className="text-surface-500 text-sm mb-3 line-clamp-2">{kb.description}</p>
                            )}
                            <div className="text-xs text-surface-400">
                                Updated {new Date(kb.updatedAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-semibold text-surface-900 mb-4">Create Knowledge Base</h2>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={createName}
                                        onChange={(e) => setCreateName(e.target.value)}
                                        required
                                        placeholder="e.g. Product FAQ, Company Info"
                                        className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">
                                        Description <span className="text-surface-400">(optional)</span>
                                    </label>
                                    <textarea
                                        value={createDesc}
                                        onChange={(e) => setCreateDesc(e.target.value)}
                                        placeholder="Describe the purpose of this knowledge base..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 text-sm text-surface-600 hover:text-surface-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !createName.trim()}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===========================
// Knowledge Base Detail View
// ===========================

function KnowledgeBaseDetail({ kbId, onBack }: { kbId: string; onBack: () => void }) {
    const { kb, documents, loading, error, uploadDocument, removeDocument } = useKnowledgeBase(kbId);

    // Upload state
    const [showUpload, setShowUpload] = useState(false);
    const [uploadType, setUploadType] = useState<'manual' | 'url' | 'faq' | 'gsheet'>('manual');
    const [fileName, setFileName] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [faqPairs, setFaqPairs] = useState([{ question: '', answer: '' }]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addFaqPair = () => setFaqPairs((prev) => [...prev, { question: '', answer: '' }]);
    const removeFaqPair = (idx: number) => setFaqPairs((prev) => prev.filter((_, i) => i !== idx));
    const updateFaqPair = (idx: number, field: 'question' | 'answer', value: string) => {
        setFaqPairs((prev) => prev.map((pair, i) => (i === idx ? { ...pair, [field]: value } : pair)));
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        setFileName(file.name);
        setFileContent(text);

        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';

        try {
            setUploading(true);
            await uploadDocument({
                fileName: file.name,
                fileType: ext === 'pdf' ? 'pdf' : ext === 'csv' ? 'csv' : 'txt',
                fileSize: file.size,
                content: text,
            });
            toast.success(`Uploaded "${file.name}"`);
            setFileName('');
            setFileContent('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleManualUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileName.trim()) return;

        try {
            setUploading(true);
            if (uploadType === 'url') {
                await uploadDocument({
                    fileName: fileName.trim(),
                    fileType: 'url',
                    sourceUrl: sourceUrl.trim(),
                });
            } else if (uploadType === 'faq') {
                const validPairs = faqPairs.filter((p) => p.question.trim() && p.answer.trim());
                if (validPairs.length === 0) {
                    toast.error('Add at least one Q&A pair');
                    setUploading(false);
                    return;
                }
                const content = validPairs.map((p) => `Q: ${p.question.trim()}\nA: ${p.answer.trim()}`).join('\n\n---\n\n');
                await uploadDocument({
                    fileName: fileName.trim(),
                    fileType: 'faq',
                    content,
                });
            } else if (uploadType === 'gsheet') {
                await uploadDocument({
                    fileName: fileName.trim(),
                    fileType: 'gsheet',
                    sourceUrl: sourceUrl.trim(),
                });
            } else {
                await uploadDocument({
                    fileName: fileName.trim(),
                    fileType: 'manual',
                    content: fileContent,
                });
            }
            toast.success('Document added');
            setShowUpload(false);
            setFileName('');
            setFileContent('');
            setSourceUrl('');
            setFaqPairs([{ question: '', answer: '' }]);
        } catch (err: any) {
            toast.error(err.message || 'Failed to add document');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveDoc = async (docId: string, docName: string) => {
        if (!confirm(`Delete "${docName}"?`)) return;
        try {
            await removeDocument(docId);
            toast.success('Document deleted');
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete document');
        }
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            processing: 'bg-blue-50 text-blue-700 border-blue-200',
            ready: 'bg-green-50 text-green-700 border-green-200',
            failed: 'bg-red-50 text-red-700 border-red-200',
        };
        return (
            <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-surface-100 text-surface-600 border-surface-200'}`}
            >
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="text-sm text-surface-500 hover:text-surface-700 mb-3 flex items-center gap-1 transition-colors"
                >
                    ← Back to Knowledge Bases
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-surface-900 tracking-tight">
                            📚 {kb?.name ?? 'Knowledge Base'}
                        </h1>
                        {kb?.description && (
                            <p className="text-surface-500 mt-1">{kb.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowUpload(true)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                            + Add Document
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.csv,.pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 border border-surface-200 text-surface-700 rounded-lg hover:bg-surface-50 transition-colors text-sm font-medium"
                        >
                            📎 Upload File
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
                    {error}
                </div>
            )}

            {/* Documents List */}
            {documents.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-surface-200 text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-semibold text-surface-900 mb-2">No documents yet</h3>
                    <p className="text-surface-500 text-sm mb-6">
                        Upload files or add content manually to build this knowledge base.
                    </p>
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => setShowUpload(true)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                            Add Manual Entry
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 border border-surface-200 text-surface-700 rounded-lg hover:bg-surface-50 transition-colors text-sm font-medium"
                        >
                            Upload File
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-100">
                                <th className="text-left px-5 py-3 text-xs font-medium text-surface-500 uppercase">
                                    Document
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-surface-500 uppercase">
                                    Type
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-surface-500 uppercase">
                                    Status
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-surface-500 uppercase">
                                    Size
                                </th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-surface-500 uppercase">
                                    Added
                                </th>
                                <th className="text-right px-5 py-3 text-xs font-medium text-surface-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr
                                    key={doc.id}
                                    className="border-b border-surface-50 hover:bg-surface-25 transition-colors"
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span>{FILE_TYPE_ICONS[doc.fileType] || '📄'}</span>
                                            <span className="text-sm font-medium text-surface-900 truncate max-w-[200px]">
                                                {doc.fileName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-medium border ${FILE_TYPE_COLORS[doc.fileType] || 'bg-surface-50 text-surface-600 border-surface-200'}`}
                                        >
                                            {doc.fileType.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">{statusBadge(doc.status)}</td>
                                    <td className="px-5 py-3 text-sm text-surface-500">
                                        {doc.fileSize
                                            ? doc.fileSize < 1024
                                                ? `${doc.fileSize} B`
                                                : doc.fileSize < 1048576
                                                    ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                                                    : `${(doc.fileSize / 1048576).toFixed(1)} MB`
                                            : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-surface-500">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            onClick={() => handleRemoveDoc(doc.id, doc.fileName)}
                                            className="text-surface-400 hover:text-red-500 transition-colors text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Upload Dialog */}
            {showUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-lg font-semibold text-surface-900 mb-4">Add Document</h2>

                        {/* Type Tabs */}
                        <div className="flex gap-1 mb-4 bg-surface-100 p-1 rounded-lg">
                            {[
                                { key: 'manual' as const, label: '✏️ Manual' },
                                { key: 'url' as const, label: '🔗 URL' },
                                { key: 'faq' as const, label: '❓ FAQ' },
                                { key: 'gsheet' as const, label: '📊 Sheets' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setUploadType(tab.key)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${uploadType === tab.key
                                        ? 'bg-white text-surface-900 shadow-sm'
                                        : 'text-surface-500 hover:text-surface-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleManualUpload}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">
                                        Document Name
                                    </label>
                                    <input
                                        type="text"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        required
                                        placeholder="e.g. Product FAQ, Pricing Info"
                                        className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                {uploadType === 'manual' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 mb-1">
                                            Content
                                        </label>
                                        <textarea
                                            value={fileContent}
                                            onChange={(e) => setFileContent(e.target.value)}
                                            placeholder="Paste or type your knowledge content here..."
                                            rows={8}
                                            className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono"
                                        />
                                    </div>
                                ) : uploadType === 'url' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 mb-1">
                                            Source URL
                                        </label>
                                        <input
                                            type="url"
                                            value={sourceUrl}
                                            onChange={(e) => setSourceUrl(e.target.value)}
                                            required
                                            placeholder="https://example.com/faq"
                                            className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <p className="text-xs text-surface-400 mt-1">
                                            Content will be automatically scraped from this URL.
                                        </p>
                                    </div>
                                ) : uploadType === 'faq' ? (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-surface-700">
                                            Q&A Pairs
                                        </label>
                                        {faqPairs.map((pair, idx) => (
                                            <div key={idx} className="border border-surface-200 rounded-lg p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-surface-500">#{idx + 1}</span>
                                                    {faqPairs.length > 1 && (
                                                        <button type="button" onClick={() => removeFaqPair(idx)}
                                                            className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={pair.question}
                                                    onChange={(e) => updateFaqPair(idx, 'question', e.target.value)}
                                                    placeholder="Question"
                                                    className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                                <textarea
                                                    value={pair.answer}
                                                    onChange={(e) => updateFaqPair(idx, 'answer', e.target.value)}
                                                    placeholder="Answer"
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                                />
                                            </div>
                                        ))}
                                        <button type="button" onClick={addFaqPair}
                                            className="w-full py-2 border border-dashed border-surface-300 rounded-lg text-sm text-surface-500 hover:text-surface-700 hover:border-surface-400 transition-colors">
                                            + Add Another Q&A Pair
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 mb-1">
                                            Google Sheets URL
                                        </label>
                                        <input
                                            type="url"
                                            value={sourceUrl}
                                            onChange={(e) => setSourceUrl(e.target.value)}
                                            required
                                            placeholder="https://docs.google.com/spreadsheets/d/..."
                                            className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <p className="text-xs text-surface-400 mt-1">
                                            Sheet must be publicly shared (&quot;Anyone with the link&quot;).
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUpload(false);
                                        setFileName('');
                                        setFileContent('');
                                        setSourceUrl('');
                                    }}
                                    className="px-4 py-2 text-sm text-surface-600 hover:text-surface-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !fileName.trim()}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
                                >
                                    {uploading ? 'Adding...' : 'Add Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
