import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Pedidos from '../components/Pedidos'
import Servicos from '../components/Servicos'
import { pad } from '../utils/slots'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

// 06:00, 06:30, ... 23:30
const HORAS = Array.from({ length: 36 }, (_, i) => {
  const meias = i + 12
  return `${pad(Math.floor(meias / 2))}:${meias % 2 ? '30' : '00'}`
})

function SeletorHora({ valor, aoMudar }) {
  const atual = valor.slice(0, 5) // "09:00:00" -> "09:00"
  const opcoes = HORAS.includes(atual) ? HORAS : [...HORAS, atual].sort()
  return (
    <select value={atual} onChange={(e) => aoMudar(e.target.value)}>
      {opcoes.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  )
}

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
  const linha = horarios.find((h) => h.id === id)
  const inicio = campo === 'hora_inicio' ? valor : linha.hora_inicio.slice(0, 5)
  const fim = campo === 'hora_fim' ? valor : linha.hora_fim.slice(0, 5)

  if (fim <= inicio) {
    alert('A hora de fim tem de ser depois da hora de início.')
    return
  }

  await supabase.from('disponibilidade').update({ [campo]: valor }).eq('id', id)
  carregarHorarios()
  }

  async function adicionarBloqueio(e) {
    e.preventDefault()
    if (novoBloqueio.fim <= novoBloqueio.inicio) {
      alert('O fim do bloqueio tem de ser depois do início.')
      return
    }
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
    <div className="admin">
      <div className="admin-topo">
        <h1>Painel</h1>
        <button onClick={logout}>Sair</button>
      </div>
      <Pedidos />
      <Servicos />

      <h2>Horário semanal</h2>
      {horarios.map((h) => (
        <div key={h.id}>
          <span>{DIAS[h.dia_semana]}: </span>
          <SeletorHora
            valor={h.hora_inicio}
            aoMudar={(v) => atualizarHorario(h.id, 'hora_inicio', v)}
          />
          {' até '}
          <SeletorHora
            valor={h.hora_fim}
            aoMudar={(v) => atualizarHorario(h.id, 'hora_fim', v)}
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