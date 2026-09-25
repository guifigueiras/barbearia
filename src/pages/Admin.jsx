import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

function Admin() {
  const [horarios, setHorarios] = useState([])
  const [bloqueios, setBloqueios] = useState([])
  const [novoBloqueio, setNovoBloqueio] = useState({ inicio: '', fim: '', motivo: '' })
  const navigate = useNavigate()

  useEffect(() => {
    carregarHorarios()
    carregarBloqueios()
  }, [])

  async function carregarHorarios() {
    const { data } = await supabase.from('disponibilidade').select('*').order('dia_semana')
    setHorarios(data || [])
  }

  async function carregarBloqueios() {
    const { data } = await supabase.from('bloqueios').select('*').order('inicio')
    setBloqueios(data || [])
  }

  async function atualizarHorario(id, campo, valor) {
    await supabase.from('disponibilidade').update({ [campo]: valor }).eq('id', id)
    carregarHorarios()
  }

  async function adicionarBloqueio(e) {
    e.preventDefault()
    await supabase.from('bloqueios').insert(novoBloqueio)
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
    <div>
      <h1>Painel da barbeira</h1>
      <button onClick={logout}>Sair</button>

      <h2>Horário semanal</h2>
      {horarios.map((h) => (
        <div key={h.id}>
          <span>{DIAS[h.dia_semana]}: </span>
          <input
            type="time"
            value={h.hora_inicio}
            onChange={(e) => atualizarHorario(h.id, 'hora_inicio', e.target.value)}
          />
          {' até '}
          <input
            type="time"
            value={h.hora_fim}
            onChange={(e) => atualizarHorario(h.id, 'hora_fim', e.target.value)}
          />
        </div>
      ))}

      <h2>Bloqueios (férias, imprevistos)</h2>
      <form onSubmit={adicionarBloqueio}>
        <input
          type="datetime-local"
          value={novoBloqueio.inicio}
          onChange={(e) => setNovoBloqueio({ ...novoBloqueio, inicio: e.target.value })}
          required
        />
        <input
          type="datetime-local"
          value={novoBloqueio.fim}
          onChange={(e) => setNovoBloqueio({ ...novoBloqueio, fim: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Motivo"
          value={novoBloqueio.motivo}
          onChange={(e) => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })}
        />
        <button type="submit">Adicionar bloqueio</button>
      </form>

      <ul>
        {bloqueios.map((b) => (
          <li key={b.id}>
            {b.inicio} até {b.fim} — {b.motivo}
            <button onClick={() => apagarBloqueio(b.id)}>Remover</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Admin