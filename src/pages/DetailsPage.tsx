import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Search, Clock, Tag, TrendingUp } from 'lucide-react';
import { getJobResult, JobResult } from '../api/client';

interface DetailsPageProps {
  jobId: string;
  onBack: () => void;
}

export function DetailsPage({ jobId, onBack }: DetailsPageProps) {
  const [result, setResult] = useState<JobResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await getJobResult(jobId);
        setResult(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [jobId]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyMessage(`${label} copied!`);
    setTimeout(() => setCopyMessage(''), 2000);
  };

  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-400 text-gray-900">$1</mark>');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 text-red-200">
          {error || 'Failed to load result'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to History
      </button>

      <div className="space-y-6">
        {result.summary && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <h2 className="text-3xl font-bold mb-6">{result.summary.title}</h2>

            <div className="mb-6 pb-6 border-b border-gray-700">
              <div className="flex items-start gap-3">
                <TrendingUp className="text-blue-400 mt-1" size={20} />
                <div>
                  <div className="text-sm font-semibold text-gray-400 mb-2">TL;DR</div>
                  <p className="text-lg text-gray-200">{result.summary.tldr}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Key Points</h3>
              <ul className="space-y-3">
                {result.summary.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-gray-200">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.summary.entities && result.summary.entities.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={18} className="text-gray-400" />
                  <h3 className="text-lg font-semibold">Named Entities</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.summary.entities.map((entity, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-200"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.summary.keyMoments && result.summary.keyMoments.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-gray-400" />
                  <h3 className="text-lg font-semibold">Key Moments</h3>
                </div>
                <div className="space-y-2">
                  {result.summary.keyMoments.map((moment, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-blue-400 font-mono font-semibold">{moment.time}</span>
                      <span className="text-gray-300">{moment.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => handleCopy(JSON.stringify(result.summary, null, 2), 'Summary')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Copy size={16} />
              Copy Summary
            </button>
          </div>
        )}

        {result.transcript && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Transcript</h3>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {showTranscript ? 'Hide' : 'Show'}
              </button>
            </div>

            {showTranscript && (
              <>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search transcript..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 max-h-96 overflow-y-auto">
                  <p
                    className="text-gray-200 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: highlightText(result.transcript.text) }}
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleCopy(result.transcript!.text, 'Transcript')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Copy size={16} />
                    Copy Transcript
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {result.language && (
              <div>
                <span className="text-gray-400">Language:</span>
                <span className="ml-2 text-gray-200">{result.language}</span>
              </div>
            )}
            {result.metadata?.duration && (
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="ml-2 text-gray-200">{result.metadata.duration}s</span>
              </div>
            )}
            <div>
              <span className="text-gray-400">Transcription Model:</span>
              <span className="ml-2 text-gray-200">{result.modelInfo.transcription}</span>
            </div>
            <div>
              <span className="text-gray-400">Summary Model:</span>
              <span className="ml-2 text-gray-200">{result.modelInfo.summarization}</span>
            </div>
          </div>
        </div>

        {copyMessage && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {copyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
