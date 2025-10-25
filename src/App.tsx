import { useState } from 'react';
import { SubmitPage } from './pages/SubmitPage';
import { StatusPage } from './pages/StatusPage';
import { DetailsPage } from './pages/DetailsPage';
import { ListPage } from './pages/ListPage';
import { BeamsBackground } from './components/BeamsBackground';
import { Video } from 'lucide-react';

type Page = 'submit' | 'status' | 'details' | 'list';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('submit');
  const [currentJobId, setCurrentJobId] = useState<string>('');

  const navigateTo = (page: Page, jobId?: string) => {
    setCurrentPage(page);
    if (jobId) setCurrentJobId(jobId);
  };

  return (
    <div className="min-h-screen text-slate-100">
      <BeamsBackground />

      <nav className="relative z-10 backdrop-blur-xl bg-slate-900/30 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <Video size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Instagram Reel Summarizer
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigateTo('submit')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  currentPage === 'submit'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                Submit
              </button>
              <button
                onClick={() => navigateTo('list')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  currentPage === 'list'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                History
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentPage === 'submit' && <SubmitPage onSubmit={(id) => navigateTo('status', id)} />}
        {currentPage === 'status' && (
          <StatusPage
            jobId={currentJobId}
            onComplete={(id) => navigateTo('details', id)}
            onBack={() => navigateTo('submit')}
          />
        )}
        {currentPage === 'details' && (
          <DetailsPage jobId={currentJobId} onBack={() => navigateTo('list')} />
        )}
        {currentPage === 'list' && (
          <ListPage onSelectJob={(id) => navigateTo('details', id)} />
        )}
      </main>
    </div>
  );
}

export default App;
