import { useEffect, useState } from 'react';
import { Search, Filter, Clock, CheckCircle, XCircle, Loader2, Video, Trash2 } from 'lucide-react';
import { listJobs, JobResult, deleteJob } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ListPageProps {
  onSelectJob: (jobId: string) => void;
}

export function ListPage({ onSelectJob }: ListPageProps) {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; jobId: string; title: string }>({
    isOpen: false,
    jobId: '',
    title: ''
  });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchJobs();
  }, [searchTerm, statusFilter, page]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listJobs({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE
      });
      setJobs(response.results);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    setDeleting(jobId);
    try {
      await deleteJob(jobId);
      setSuccessMessage('Process deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchJobs();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeleting(null);
      setDeleteConfirm({ isOpen: false, jobId: '', title: '' });
    }
  };

  const handleViewVideo = (videoUrl: string) => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  const getStatusIcon = (job: JobResult) => {
    if (job.summary) {
      return <CheckCircle className="text-emerald-400" size={20} />;
    }
    if (!job.summary && job.transcript) {
      return <XCircle className="text-red-400" size={20} />;
    }
    return <Loader2 className="text-cyan-400 animate-spin" size={20} />;
  };

  const getStatusText = (job: JobResult) => {
    if (job.summary) return 'Completed';
    if (!job.summary && job.transcript) return 'Failed';
    return 'Processing';
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
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Processing History
        </h2>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              placeholder="Search transcripts and summaries..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="pl-12 pr-10 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white appearance-none cursor-pointer transition-all"
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
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">No results found</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="group bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 transition-all hover:bg-slate-900/60 hover:border-slate-600 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex items-start gap-4 flex-1 ${
                        job.summary ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      onClick={() => job.summary && onSelectJob(job.id)}
                    >
                      {getStatusIcon(job)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white text-lg truncate">
                            {job.summary?.title || 'Processing...'}
                          </h3>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                              job.summary
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {getStatusText(job)}
                          </span>
                        </div>
                        {job.summary?.tldr && (
                          <p className="text-sm text-slate-300 mb-3 leading-relaxed">{truncate(job.summary.tldr, 140)}</p>
                        )}
                        {job.metadata?.caption && (
                          <p className="text-xs text-slate-400 mb-3 italic">{truncate(job.metadata.caption, 100)}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {formatDate(job.createdAt)}
                          </div>
                          {job.language && (
                            <div className="px-2 py-1 bg-slate-800/50 rounded">Language: {job.language}</div>
                          )}
                          {job.metadata?.duration && (
                            <div className="px-2 py-1 bg-slate-800/50 rounded">Duration: {job.metadata.duration}s</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {job.videoUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewVideo(job.videoUrl!);
                          }}
                          className="p-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30"
                          title="View Video"
                        >
                          <Video size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({
                            isOpen: true,
                            jobId: job.id,
                            title: job.summary?.title || 'this process'
                          });
                        }}
                        disabled={deleting === job.id}
                        className="p-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        {deleting === job.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700/50">
                <div className="text-sm text-slate-400">
                  Showing <span className="text-white font-medium">{page * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="text-white font-medium">{Math.min((page + 1) * ITEMS_PER_PAGE, total)}</span> of{' '}
                  <span className="text-white font-medium">{total}</span> results
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                    className="px-5 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 disabled:bg-slate-800/30 disabled:cursor-not-allowed rounded-lg transition-colors font-medium border border-slate-600/50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="px-5 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 disabled:bg-slate-800/30 disabled:cursor-not-allowed rounded-lg transition-colors font-medium border border-slate-600/50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Process"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => handleDelete(deleteConfirm.jobId)}
        onCancel={() => setDeleteConfirm({ isOpen: false, jobId: '', title: '' })}
      />

      {successMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl border border-emerald-500 animate-slide-in-bottom z-50">
          {successMessage}
        </div>
      )}
    </div>
  );
}
