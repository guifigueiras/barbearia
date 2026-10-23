import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Marcar from './pages/Marcar'
import Admin from './pages/Admin'
import Login from './pages/Login'
import ProtectedRoute from './pages/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas: com cabeçalho e rodapé */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/marcar" element={<Marcar />} />
        </Route>

        {/* Área reservada: sem cabeçalho público */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Endereço que não existe: volta ao início */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App