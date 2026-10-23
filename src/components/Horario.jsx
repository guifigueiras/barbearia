import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { pad } from '../utils/slots'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

// 06:00, 06:30, ... 23:30
const HORAS = Array.from({ length: 36 }, (_, i) => {
  const meias = i + 12
  return `${pad(Math.floor(meias / 2))}:${meias % 2 ? '30' : '00'}`
})

function SeletorHora({ valor, aoMudar }) {
  const opcoes = HORAS.includes(valor) ? HORAS : [...HORAS, valor].sort()
  return (
    <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
      {opcoes.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  )
}

// Sugestão para um turno novo: a seguir ao último, ou 10:00–19:00 se o dia está fechado
function turnoPorDefeito(turnos) {
  if (turnos.length === 0) return { inicio: '10:00', fim: '19:00' }
  const inicio = turnos[turnos.length - 1].hora_fim.slice(0, 5)
  const [h, m] = inicio.split(':').map(Number)
  const fimMin = Math.min(h * 60 + m + 120, 23 * 60 + 30)
  return { inicio, fim: `${pad(Math.floor(fimMin / 60))}:${pad(fimMin % 60)}` }
}

function LinhaTurno({ turno, aoAlterar }) {
  const inicioGuardado = turno.hora_inicio.slice(0, 5)
  const fimGuardado = turno.hora_fim.slice(0, 5)

  const [inicio, setInicio] = useState(inicioGuardado)
  const [fim, setFim] = useState(fimGuardado)
  const [erro, setErro] = useState('')

  const alterado = inicio !== inicioGuardado || fim !== fimGuardado

  async function guardar() {
    if (fim <= inicio) {
      setErro('A hora de fim tem de ser depois da hora de início.')
      return
    }
    const { error } = await supabase
      .from('disponibilidade')
      .update({ hora_inicio: inicio, hora_fim: fim })
      .eq('id', turno.id)

    if (error) {
      setErro(error.message)
    } else {
      setErro('')
      aoAlterar()
    }
  }

  async function remover() {
    const { error } = await supabase.from('disponibilidade').delete().eq('id', turno.id)
    if (error) setErro(error.message)
    else aoAlterar()
  }

  return (
    <li>
      <SeletorHora valor={inicio} aoMudar={setInicio} /> até{' '}
      <SeletorHora valor={fim} aoMudar={setFim} />{' '}
      <button onClick={guardar} disabled={!alterado}>
        Guardar
      </button>{' '}
      <button onClick={remover}>Remover</button>
      {erro && <span className="erro"> {erro}</span>}
    </li>
  )
}

function Dia({ nome, indice, turnos, aoAlterar }) {
  const [erro, setErro] = useState('')

  async function adicionarTurno() {
    const { inicio, fim } = turnoPorDefeito(turnos)
    if (fim <= inicio) {
      setErro('Não há espaço depois do último turno.')
      return
    }
    const { error } = await supabase
      .from('disponibilidade')
      .insert({ dia_semana: indice, hora_inicio: inicio, hora_fim: fim })

    if (error) {
      setErro(error.message)
    } else {
      setErro('')
      aoAlterar()
    }
  }

  return (
    <div className="dia-horario">
      <h3>
        {nome} {turnos.length === 0 && <span className="suave">· fechado</span>}
      </h3>
      <ul>
        {turnos.map((t) => (
          <LinhaTurno key={t.id} turno={t} aoAlterar={aoAlterar} />
        ))}
      </ul>
      <button onClick={adicionarTurno}>
        {turnos.length ? '+ Adicionar turno' : 'Abrir este dia'}
      </button>
      {erro && <p className="erro">{erro}</p>}
    </div>
  )
}

function Horario() {
  const [turnos, setTurnos] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data, error } = await supabase
      .from('disponibilidade')
      .select('*')
      .order('dia_semana')
      .order('hora_inicio')

    if (error) setErro('Erro ao carregar o horário: ' + error.message)
    else setTurnos(data)
  }

  return (
    <section>
      <h2>Horário semanal</h2>
      {erro && <p className="erro">{erro}</p>}
      {DIAS.map((nome, i) => (
        <Dia
          key={nome}
          nome={nome}
          indice={i}
          turnos={turnos.filter((t) => t.dia_semana === i)}
          aoAlterar={carregar}
        />
      ))}
    </section>
  )
}

export default Horario