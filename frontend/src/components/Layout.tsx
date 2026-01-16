import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-yellow-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-yellow-950 p-2 rounded-lg group-hover:bg-yellow-900 transition-colors">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Lecture Library</h1>
                <p className="text-sm text-blue-200">Transform lectures into study materials</p>
              </div>
            </Link>
            
            <nav className="flex items-center space-x-6">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/'
                    ? 'bg-yellow-950 text-white'
                    : 'text-blue-200 hover:bg-navy-800'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-navy-950 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-blue-200">© 2024 Lecture Library. Built with ❤️ for students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

