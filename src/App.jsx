import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { PromptProvider } from './context/PromptContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import AddPromptPage from './pages/AddPromptPage'
import EditPromptPage from './pages/EditPromptPage'
import FavoritesPage from './pages/FavoritesPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <PromptProvider>
      {/* ── Global toast container — render once, fire from anywhere ── */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '10px 16px',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add" element={<AddPromptPage />} />
            <Route path="/edit/:id" element={<EditPromptPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </PromptProvider>
  )
}
