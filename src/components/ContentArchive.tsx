import { useEffect, useState } from 'react';
import { Search, Filter, Clock, CheckCircle, XCircle, Loader2, Video, Trash2, Image as ImageIcon, FileText, Film } from 'lucide-react';
import { listContentItems, deleteContentItem } from '../api/client';
import { ConfirmDialog } from './ConfirmDialog';

interface ContentArchiveProps {
  onSelectItem: (id: string) => void;
}

type ContentTab = 'all' | 'reels' | 'posts' | 'ocr';

export function ContentArchive({ onSelectItem }: ContentArchiveProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ContentTab>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string; title: string }>({
    isOpen: false,
    itemId: '',
    title: ''
  });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchItems();
  }, [searchTerm, statusFilter, activeTab, page]);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const contentType = activeTab === 'all' ? undefined : activeTab === 'reels' ? 'reel' : activeTab === 'posts' ? 'post' : 'ocr';

      const response = await listContentItems({
        content_type: contentType as any,
        status: statusFilter || undefined,
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE
      });

      const filteredItems = searchTerm
        ? response.results.filter((item: any) => {
            const summary = item.summaries?.[0];
            const transcript = item.transcripts?.[0];
            const ocr = item.ocr_extractions?.[0];
            const metadata = item.content_metadata?.[0];

            const searchLower = searchTerm.toLowerCase();
            return (
              summary?.title?.toLowerCase().includes(searchLower) ||
              summary?.tldr?.toLowerCase().includes(searchLower) ||
              transcript?.text?.toLowerCase().includes(searchLower) ||
              ocr?.extracted_text?.toLowerCase().includes(searchLower) ||
              metadata?.caption?.toLowerCase().includes(searchLower) ||
              item.id?.toLowerCase().includes(searchLower)
            );
          })
        : response.results;

      setItems(filteredItems);
      setTotal(searchTerm ? filteredItems.length : response.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setDeleting(itemId);
    try {
      await deleteContentItem(itemId);
      setSuccessMessage('Item deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchItems();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeleting(null);
      setDeleteConfirm({ isOpen: false, itemId: '', title: '' });
    }
  };

  const getStatusIcon = (item: any) => {
    if (item.status === 'completed') {
      return <CheckCircle className="text-emerald-400" size={20} />;
    }
    if (item.status === 'failed') {
      return <XCircle className="text-red-400" size={20} />;
    }
    return <Loader2 className="text-cyan-400 animate-spin" size={20} />;
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const truncate = (text: string, length: number) => {
    return text?.length > length ? text.substring(0, length) + '...' : text;
  };

  const getItemTitle = (item: any) => {
    if (item.summaries?.[0]?.title) return item.summaries[0].title;
    if (item.content_type === 'ocr') return 'OCR Extraction';
    if (item.content_type === 'post') return 'Instagram Post';
    return 'Processing...';
  };

  const getItemDescription = (item: any) => {
    if (item.summaries?.[0]?.tldr) return item.summaries[0].tldr;
    if (item.content_metadata?.[0]?.caption) return item.content_metadata[0].caption;
    if (item.ocr_extractions?.[0]?.extracted_text) return item.ocr_extractions[0].extracted_text;
    return null;
  };

  const getContentTypeIcon = (type: string) => {
    if (type === 'reel') return <Film size={18} className="text-purple-400" />;
    if (type === 'post') return <ImageIcon size={18} className="text-green-400" />;
    if (type === 'ocr') return <FileText size={18} className="text-orange-400" />;
    return null;
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <section className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 md:p-8">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Content Archive
      </h2>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700/50 pb-1">
        <button
          onClick={() => { setActiveTab('all'); setPage(0); }}
          className={`px-3 md:px-4 py-2 rounded-t-lg font-medium transition-all text-sm md:text-base ${
            activeTab === 'all'
              ? 'bg-slate-700/50 text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
          }`}
        >
          All Content
        </button>
        <button
          onClick={() => { setActiveTab('reels'); setPage(0); }}
          className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-t-lg font-medium transition-all text-sm md:text-base ${
            activeTab === 'reels'
              ? 'bg-slate-700/50 text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
          }`}
        >
          <Film size={16} />
          Reels
        </button>
        <button
          onClick={() => { setActiveTab('posts'); setPage(0); }}
          className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-t-lg font-medium transition-all text-sm md:text-base ${
            activeTab === 'posts'
              ? 'bg-slate-700/50 text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
          }`}
        >
          <ImageIcon size={16} />
          Posts
        </button>
        <button
          onClick={() => { setActiveTab('ocr'); setPage(0); }}
          className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-t-lg font-medium transition-all text-sm md:text-base ${
            activeTab === 'ocr'
              ? 'bg-slate-700/50 text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
          }`}
        >
          <FileText size={16} />
          OCR
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 md:left-4 top-3 md:top-3.5 text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Search content..."
            className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-400 transition-all text-sm md:text-base"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 md:left-4 top-3 md:top-3.5 text-slate-400" size={20} />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="w-full sm:w-auto pl-10 md:pl-12 pr-8 md:pr-10 py-2.5 md:py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white appearance-none cursor-pointer transition-all text-sm md:text-base"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-cyan-500"></div>
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-5 text-red-200 backdrop-blur-sm">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No results found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 md:p-5 transition-all hover:bg-slate-900/60 hover:border-slate-600 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="flex items-start justify-between gap-3 md:gap-4">
                  <div
                    className={`flex items-start gap-3 md:gap-4 flex-1 min-w-0 ${
                      item.status === 'completed' ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    onClick={() => item.status === 'completed' && onSelectItem(item.id)}
                  >
                    {getStatusIcon(item)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-white text-base md:text-lg truncate">
                          {getItemTitle(item)}
                        </h3>
                        <span
                          className={`text-xs px-2 md:px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                            item.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'failed'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {getStatusText(item.status)}
                        </span>
                        <span className="flex items-center gap-1 px-2 md:px-3 py-1 bg-slate-800/50 rounded-full text-xs whitespace-nowrap">
                          {getContentTypeIcon(item.content_type)}
                          <span className="capitalize">{item.content_type}</span>
                        </span>
                      </div>
                      {getItemDescription(item) && (
                        <p className="text-xs md:text-sm text-slate-300 mb-3 leading-relaxed">
                          {truncate(getItemDescription(item), 120)}
                        </p>
                      )}
                      <div className="flex items-center gap-3 md:gap-4 text-xs text-slate-400 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {formatDate(item.created_at)}
                        </div>
                        {item.content_metadata?.[0]?.likes_count !== undefined && (
                          <div className="px-2 py-1 bg-slate-800/50 rounded">
                            {item.content_metadata[0].likes_count} likes
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {item.video_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.video_url, '_blank', 'noopener,noreferrer');
                        }}
                        className="p-2 md:p-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30"
                        title="View Video"
                      >
                        <Video size={16} className="md:w-[18px] md:h-[18px]" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          isOpen: true,
                          itemId: item.id,
                          title: getItemTitle(item)
                        });
                      }}
                      disabled={deleting === item.id}
                      className="p-2 md:p-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      {deleting === item.id ? (
                        <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" />
                      ) : (
                        <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 md:mt-8 pt-6 border-t border-slate-700/50 gap-4">
              <div className="text-xs md:text-sm text-slate-400 text-center sm:text-left">
                Showing <span className="text-white font-medium">{page * ITEMS_PER_PAGE + 1}</span> to{' '}
                <span className="text-white font-medium">{Math.min((page + 1) * ITEMS_PER_PAGE, total)}</span> of{' '}
                <span className="text-white font-medium">{total}</span> results
              </div>
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="px-4 md:px-5 py-2 md:py-2.5 bg-slate-700/50 hover:bg-slate-600/50 disabled:bg-slate-800/30 disabled:cursor-not-allowed rounded-lg transition-colors font-medium border border-slate-600/50 text-sm md:text-base"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-4 md:px-5 py-2 md:py-2.5 bg-slate-700/50 hover:bg-slate-600/50 disabled:bg-slate-800/30 disabled:cursor-not-allowed rounded-lg transition-colors font-medium border border-slate-600/50 text-sm md:text-base"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Content"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => handleDelete(deleteConfirm.itemId)}
        onCancel={() => setDeleteConfirm({ isOpen: false, itemId: '', title: '' })}
      />

      {successMessage && (
        <div className="fixed bottom-4 md:bottom-6 right-4 md:right-6 bg-emerald-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-2xl border border-emerald-500 animate-slide-in-bottom z-50 text-sm md:text-base">
          {successMessage}
        </div>
      )}
    </section>
  );
}
