import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { deLocalISO } from '../utils/slots'
import Pedidos from '../components/Pedidos'
import Servicos from '../components/Servicos'
import Horario from '../components/Horario'

function formatarDataHora(texto) {
  return deLocalISO(texto).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
}

function Admin() {
  const [bloqueios, setBloqueios] = useState([])
  const [novoBloqueio, setNovoBloqueio] = useState({ inicio: '', fim: '', motivo: '' })
  const navigate = useNavigate()

  useEffect(() => {
    carregarBloqueios()
  }, [])

  async function carregarBloqueios() {
    const { data } = await supabase.from('bloqueios').select('*').order('inicio')
    setBloqueios(data || [])
  }

  async function adicionarBloqueio(e) {
    e.preventDefault()
    if (novoBloqueio.fim <= novoBloqueio.inicio) {
      alert('O fim do bloqueio tem de ser depois do início.')
      return
    }
    await supabase.from('bloqueios').insert({
      inicio: novoBloqueio.inicio,
      fim: novoBloqueio.fim,
      motivo: novoBloqueio.motivo.trim() || null,
    })
    setNovoBloqueio({ inicio: '', fim: '', motivo: '' })
    carregarBloqueios()
  }

  async function apagarBloqueio(id) {
    await supabase.from('bloqueios').delete().eq('id', id)
    carregarBloqueios()
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="admin">
      <div className="admin-topo">
        <h1>Painel</h1>
        <button onClick={logout}>Sair</button>
      </div>

      <Pedidos />
      <Servicos />
      <Horario />

      <h2>Bloqueios (férias, imprevistos)</h2>
      <form onSubmit={adicionarBloqueio}>
        <input
          type="datetime-local"
          value={novoBloqueio.inicio}
          onChange={(e) => setNovoBloqueio({ ...novoBloqueio, inicio: e.target.value })}
          required
        />{' '}
        <input
          type="datetime-local"
          value={novoBloqueio.fim}
          onChange={(e) => setNovoBloqueio({ ...novoBloqueio, fim: e.target.value })}
          required
        />{' '}
        <input
          type="text"
          placeholder="Motivo (opcional)"
          value={novoBloqueio.motivo}
          onChange={(e) => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })}
        />{' '}
        <button type="submit">Adicionar bloqueio</button>
      </form>

      <ul>
        {bloqueios.map((b) => (
          <li key={b.id}>
            {formatarDataHora(b.inicio)} até {formatarDataHora(b.fim)}
            {b.motivo && ` — ${b.motivo}`}{' '}
            <button onClick={() => apagarBloqueio(b.id)}>Remover</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Admin