import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { ingestReel } from '../api/client';

interface SubmitPageProps {
  onSubmit: (jobId: string) => void;
}

export function SubmitPage({ onSubmit }: SubmitPageProps) {
  const [reelUrl, setReelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reelUrl.trim()) {
      setError('Please enter a reel URL');
      return;
    }

    if (!reelUrl.includes('instagram.com')) {
      setError('Please enter a valid Instagram reel URL');
      return;
    }

    setLoading(true);

    try {
      const result = await ingestReel(reelUrl);
      onSubmit(result.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit reel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl mb-4">
            <Sparkles className="text-cyan-400" size={32} />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Submit Instagram Reel
          </h2>
          <p className="text-slate-400 text-lg">
            Transform any Instagram Reel into a structured summary with AI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="reelUrl" className="block text-sm font-semibold mb-3 text-slate-200">
              Reel URL
            </label>
            <input
              type="text"
              id="reelUrl"
              value={reelUrl}
              onChange={(e) => setReelUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-400 transition-all text-lg"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-5 text-red-200 backdrop-blur-sm">
              <div className="font-semibold mb-1">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none text-lg"
          >
            {loading ? (
              <>
                <div className="relative">
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white/20 border-t-white"></div>
                </div>
                Processing...
              </>
            ) : (
              <>
                <Send size={22} />
                Submit for Analysis
              </>
            )}
          </button>
        </form>

        <div className="mt-10 bg-slate-900/40 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
          <h3 className="font-semibold mb-4 text-cyan-400 flex items-center gap-2">
            <Sparkles size={18} />
            How it works
          </h3>
          <ol className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                1
              </span>
              <span>Paste a public Instagram Reel URL</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                2
              </span>
              <span>We extract the video and transcribe the audio using AI</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                3
              </span>
              <span>AI generates a structured summary with key points and insights</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                4
              </span>
              <span>View the transcript, summary, and key moments in seconds</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
