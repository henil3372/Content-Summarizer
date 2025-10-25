import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { getJobStatus, retryJob, JobStatus } from '../api/client';

interface StatusPageProps {
  jobId: string;
  onComplete: (jobId: string) => void;
  onBack: () => void;
}

export function StatusPage({ jobId, onComplete, onBack }: StatusPageProps) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const result = await getJobStatus(jobId);
        setStatus(result);

        if (result.status === 'completed') {
          clearInterval(intervalId);
          setTimeout(() => onComplete(jobId), 1000);
        } else if (result.status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (err: any) {
        setError(err.message);
        clearInterval(intervalId);
      }
    };

    pollStatus();
    intervalId = setInterval(pollStatus, 2000);

    return () => clearInterval(intervalId);
  }, [jobId, onComplete]);

  const handleRetry = async () => {
    setRetrying(true);
    setError('');
    try {
      await retryJob(jobId);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRetrying(false);
    }
  };

  const getStatusColor = () => {
    if (!status) return 'bg-gray-600';
    if (status.status === 'completed') return 'bg-green-600';
    if (status.status === 'failed') return 'bg-red-600';
    return 'bg-blue-600';
  };

  const getStatusText = () => {
    if (!status) return 'Loading...';
    switch (status.status) {
      case 'queued':
        return 'Queued';
      case 'resolving_video':
        return 'Fetching Reel';
      case 'downloading':
        return 'Downloading Video';
      case 'transcribing':
        return 'Transcribing Audio';
      case 'summarizing':
        return 'Generating Summary';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status.status;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-8">Processing Reel</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {status?.status === 'completed' ? (
                <CheckCircle className="text-green-500" size={32} />
              ) : status?.status === 'failed' ? (
                <XCircle className="text-red-500" size={32} />
              ) : (
                <Loader2 className="text-blue-500 animate-spin" size={32} />
              )}
              <div>
                <div className="text-xl font-semibold">{getStatusText()}</div>
                {status?.currentStep && (
                  <div className="text-sm text-gray-400 mt-1">{status.currentStep}</div>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-400">{status?.progress || 0}%</div>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getStatusColor()}`}
              style={{ width: `${status?.progress || 0}%` }}
            />
          </div>

          {status?.errorMessage && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
              <div className="font-semibold mb-1">Error</div>
              <div className="text-sm">{status.errorMessage}</div>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                {retrying ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
              {error}
            </div>
          )}

          <div className="bg-gray-700/50 rounded-lg p-6 text-sm text-gray-300">
            <div className="font-semibold mb-2">Job ID</div>
            <code className="text-xs bg-gray-900 px-2 py-1 rounded">{jobId}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
