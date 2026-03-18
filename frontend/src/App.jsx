import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'

const base = import.meta.env.BASE_URL || '/'

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <BrowserRouter basename={base}>
      <Routes>
        <Route path="/" element={<Landing theme={theme} toggleTheme={toggle} />} />
        <Route path="/dashboard" element={<Dashboard theme={theme} toggleTheme={toggle} />} />
      </Routes>
    </BrowserRouter>
  )
}
