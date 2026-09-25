import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Marcar from './pages/Marcar'
import Admin from './pages/Admin'
import Login from './pages/Login'
import ProtectedRoute from './pages/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/marcar" element={<Marcar />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App