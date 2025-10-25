import { useState } from 'react';
import { Send, Sparkles, FileText, Film, ScanText } from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { submitContent, uploadImageForOCR } from '../api/client';
import { ContentArchive } from '../components/ContentArchive';

interface DashboardPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'ocr'>('url');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!url.includes('instagram.com')) {
      setError('Please enter a valid Instagram URL');
      return;
    }

    setLoading(true);

    try {
      const result = await submitContent(url);

      if (result.contentType === 'reel') {
        setSuccessMessage('Reel processing started!');
        setTimeout(() => {
          onNavigate('status', result.id);
        }, 1000);
      } else if (result.contentType === 'post') {
        setSuccessMessage('Post processing started!');
        setUrl('');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit content');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setOcrLoading(true);
    setError('');
    setOcrResult(null);

    try {
      const result = await uploadImageForOCR(file);
      setOcrResult(result);
      setSuccessMessage('Text extracted successfully!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 md:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl mb-4">
            <Sparkles className="text-cyan-400" size={32} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Content Processor
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Process Instagram content or extract text from images using AI
          </p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-700/50 pb-1">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium transition-all ${
              activeTab === 'url'
                ? 'bg-slate-700/50 text-cyan-400 border-b-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <Film size={18} />
            <span className="hidden sm:inline">URL Processor</span>
            <span className="sm:hidden">URL</span>
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium transition-all ${
              activeTab === 'ocr'
                ? 'bg-slate-700/50 text-cyan-400 border-b-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <ScanText size={18} />
            <span className="hidden sm:inline">OCR Extraction</span>
            <span className="sm:hidden">OCR</span>
          </button>
        </div>

        {activeTab === 'url' ? (
          <div>
            <form onSubmit={handleUrlSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-semibold mb-3 text-slate-200">
                  Instagram URL (Reel or Post)
                </label>
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.instagram.com/..."
                  className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-slate-400 transition-all text-base md:text-lg"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 md:p-5 text-red-200 backdrop-blur-sm">
                  <div className="font-semibold mb-1">Error</div>
                  <div className="text-sm">{error}</div>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4 md:p-5 text-emerald-200 backdrop-blur-sm">
                  <div className="font-semibold mb-1">Success</div>
                  <div className="text-sm">{successMessage}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 md:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none text-base md:text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-3 border-white/20 border-t-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Process Content
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/30">
              <h3 className="font-semibold mb-4 text-cyan-400 flex items-center gap-2 text-sm md:text-base">
                <Sparkles size={18} />
                How it works
              </h3>
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                    1
                  </span>
                  <span>Submit an Instagram reel or post URL</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                    2
                  </span>
                  <span>AI automatically detects if it's a reel or post</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                    3
                  </span>
                  <span>Content is processed and metadata extracted</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                    4
                  </span>
                  <span>View results in the Content Archive below</span>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div>
            <ImageUpload onUpload={handleImageUpload} loading={ocrLoading} />

            {error && (
              <div className="mt-6 bg-red-900/30 border border-red-700/50 rounded-xl p-4 md:p-5 text-red-200 backdrop-blur-sm">
                <div className="font-semibold mb-1">Error</div>
                <div className="text-sm">{error}</div>
              </div>
            )}

            {ocrResult && (
              <div className="mt-6 bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-cyan-400" size={20} />
                  <h3 className="font-semibold text-cyan-400">Extracted Text</h3>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
                  {ocrResult.result?.ocr?.extracted_text || 'No text found'}
                </div>
              </div>
            )}

            <div className="mt-8 bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/30">
              <h3 className="font-semibold mb-4 text-cyan-400 flex items-center gap-2 text-sm md:text-base">
                <ScanText size={18} />
                About OCR
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Upload any image containing text, and our AI-powered OCR will extract and save the text content
                to a structured JSON format. Perfect for digitizing documents, screenshots, or any text-based images.
              </p>
            </div>
          </div>
        )}
      </section>

      <ContentArchive onSelectItem={(id) => onNavigate('details', id)} />
    </div>
  );
}
