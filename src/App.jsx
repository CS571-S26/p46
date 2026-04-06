import './App.css'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import BuildTeamPage from './pages/BuildTeamPage.jsx'
import AnalyzePage from './pages/AnalyzePage.jsx'
import BoomBustPage from './pages/BoomBustPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import Layout from './components/Layout.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="build" element={<BuildTeamPage />} />
        <Route path="analyze" element={<AnalyzePage />} />
        <Route path="boom-bust" element={<BoomBustPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
