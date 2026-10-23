import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Erro de login:', error)
      setErro('Email ou password incorretos.')
    } else {
      navigate('/admin')
    }
  }

  return (
    <main className="login">
      <form className="cartao-login formulario" onSubmit={handleLogin}>
        <h1>Entrar</h1>
        <p className="suave">Área reservada.</p>
        <label>
          Email
          <input
            className="campo"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            className="campo"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-escuro">
          Entrar
        </button>
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
      </form>
    </main>
  )
}

export default Login