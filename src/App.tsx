import { useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { StatusPage } from './pages/StatusPage';
import { DetailsPage } from './pages/DetailsPage';
import { BeamsBackground } from './components/BeamsBackground';
import { Sparkles } from 'lucide-react';

type Page = 'dashboard' | 'status' | 'details';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
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
          <div className="flex justify-between h-16 md:h-20 items-center">
            <div
              className="flex items-center gap-2 md:gap-3 cursor-pointer"
              onClick={() => navigateTo('dashboard')}
            >
              <div className="p-1.5 md:p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg md:rounded-xl">
                <Sparkles size={20} className="text-white md:w-6 md:h-6" />
              </div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
                Content Processor AI
              </h1>
            </div>
            <div className="flex space-x-2 md:space-x-3">
              <button
                onClick={() => navigateTo('dashboard')}
                className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${
                  currentPage === 'dashboard'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {currentPage === 'dashboard' && <DashboardPage onNavigate={navigateTo} />}
        {currentPage === 'status' && (
          <StatusPage
            jobId={currentJobId}
            onComplete={(id) => navigateTo('details', id)}
            onBack={() => navigateTo('dashboard')}
          />
        )}
        {currentPage === 'details' && (
          <DetailsPage jobId={currentJobId} onBack={() => navigateTo('dashboard')} />
        )}
      </main>
    </div>
  );
}

export default App;
