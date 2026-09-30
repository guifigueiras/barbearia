import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { gerarSlots, paraLocalISO, pad } from '../utils/slots'

function Marcar() {
  const [servicos, setServicos] = useState([])
  const [disponibilidade, setDisponibilidade] = useState([])
  const [bloqueios, setBloqueios] = useState([])
  const [ocupados, setOcupados] = useState([])
  const [aCarregar, setACarregar] = useState(true)

  const [servicoId, setServicoId] = useState('')
  const [selecionados, setSelecionados] = useState([])
  const [nome, setNome] = useState('')
  const [telemovel, setTelemovel] = useState('')
  const [email, setEmail] = useState('')

  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    async function carregar() {
      const hoje = new Date()
      const limite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 15)

      const [s, d, b, o] = await Promise.all([
        supabase.from('servicos').select('*').order('id'),
        supabase.from('disponibilidade').select('*'),
        supabase.from('bloqueios').select('*'),
        supabase.rpc('slots_ocupados', {
          de: paraLocalISO(hoje),
          ate: paraLocalISO(limite),
        }),
      ])

      if (s.error || d.error || b.error || o.error) {
        setErro('Não foi possível carregar os horários. Tenta novamente mais tarde.')
      } else {
        setServicos(s.data)
        setDisponibilidade(d.data)
        setBloqueios(b.data)
        setOcupados(o.data)
      }
      setACarregar(false)
    }

    carregar()
  }, [])

  const servico = servicos.find((s) => String(s.id) === servicoId)

  const dias = useMemo(() => {
    if (!servico) return []
    return gerarSlots({
      duracaoMin: servico.duracao_min,
      disponibilidade,
      bloqueios,
      ocupados,
    })
  }, [servico, disponibilidade, bloqueios, ocupados])

  function escolherServico(id) {
    setServicoId(id)
    setSelecionados([]) // os horários possíveis dependem da duração do serviço
  }

  function alternar(iso) {
    setSelecionados((atual) =>
      atual.includes(iso) ? atual.filter((x) => x !== iso) : [...atual, iso]
    )
  }

  async function enviar(e) {
    e.preventDefault()
    setErro('')

    if (selecionados.length === 0) {
      setErro('Escolhe pelo menos um horário.')
      return
    }

    setAEnviar(true)
    const { error } = await supabase.rpc('criar_pedido', {
      p_nome: nome,
      p_telemovel: telemovel,
      p_email: email || null,
      p_servico_id: Number(servicoId),
      p_slots: selecionados,
    })
    setAEnviar(false)

    if (error) {
      setErro(error.message)
    } else {
      setEnviado(true)
    }
  }

  if (aCarregar) return <p>A carregar...</p>

  if (enviado) {
    return (
      <div>
        <h1>Pedido enviado!</h1>
        <p>
          Recebemos os teus horários. A barbeira vai escolher o que lhe der mais jeito
          e entrar em contacto contigo.
        </p>
        <Link to="/">Voltar ao início</Link>
      </div>
    )
  }

  return (
    <div>
      <h1>Marcar corte</h1>

      <h2>1. Escolhe o serviço</h2>
      <select value={servicoId} onChange={(e) => escolherServico(e.target.value)}>
        <option value="">-- Serviço --</option>
        {servicos.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nome} ({s.duracao_min} min, {s.preco}€)
          </option>
        ))}
      </select>

      {servico && (
        <>
          <h2>2. Escolhe todos os horários em que podes</h2>
          <p>Quantos mais escolheres, mais fácil é encaixar-te.</p>

          {dias.length === 0 && <p>Não há horários disponíveis nos próximos dias.</p>}

          {dias.map(({ dia, slots }) => (
            <div key={dia.toDateString()}>
              <h3>
                {dia.toLocaleDateString('pt-PT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {slots.map((slot) => {
                  const iso = paraLocalISO(slot)
                  const ativo = selecionados.includes(iso)
                  return (
                    <button
                      type="button"
                      key={iso}
                      onClick={() => alternar(iso)}
                      style={{
                        padding: '6px 12px',
                        cursor: 'pointer',
                        background: ativo ? '#222' : '#fff',
                        color: ativo ? '#fff' : '#222',
                        border: '1px solid #222',
                      }}
                    >
                      {pad(slot.getHours())}:{pad(slot.getMinutes())}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <h2>3. Os teus dados</h2>
          <form onSubmit={enviar}>
            <div>
              <input
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Telemóvel"
                value={telemovel}
                onChange={(e) => setTelemovel(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email (opcional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <p>Escolheste {selecionados.length} horário(s).</p>
            <button type="submit" disabled={aEnviar}>
              {aEnviar ? 'A enviar...' : 'Enviar pedido'}
            </button>
          </form>
        </>
      )}

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
    </div>
  )
}

export default Marcar