import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { gerarSlots, paraLocalISO, pad, DIAS_A_FRENTE } from '../utils/slots'
import { NEGOCIO, TELEMOVEL_LINK } from '../config'
import { formatarPreco, formatarDuracao } from '../utils/formatar'
import { linkWhatsApp } from '../utils/whatsapp'

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
      const limite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + DIAS_A_FRENTE + 1)

      const [s, d, b, o] = await Promise.all([
        supabase.from('servicos').select('*').eq('ativo', true).order('id'),
        supabase.from('disponibilidade').select('*'),
        supabase.from('bloqueios').select('inicio, fim'),
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

    if (error) setErro(error.message)
    else setEnviado(true)
  }

  if (aCarregar) {
    return (
      <div className="pagina">
        <p className="suave">A carregar…</p>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="pagina">
        <p className="etiqueta">Pedido enviado</p>
        <h1>Obrigado, {nome.trim().split(' ')[0]}.</h1>
        <p>
          Recebemos os teus horários. A barbeira vai escolher o que lhe der mais jeito e entra em
          contacto contigo pelo telemóvel que deixaste.
        </p>
        <Link to="/" className="btn btn-escuro">
          Voltar ao início
        </Link>
      </div>
    )
  }

  return (
    <div className="pagina">
      <p className="etiqueta">Marcação</p>
      <h1>Marca o teu corte</h1>
      <p className="suave">
        Escolhe o serviço e todos os horários em que podes. Quantos mais escolheres, mais fácil é
        encaixar-te.
      </p>

      <section className="passo">
        <h2>
          <span className="passo-num">01</span> Serviço
        </h2>
        <div className="servicos-escolha">
          {servicos.map((s) => {
            const ativo = String(s.id) === servicoId
            return (
              <button
                type="button"
                key={s.id}
                className={`cartao-servico ${ativo ? 'ativo' : ''}`}
                aria-pressed={ativo}
                onClick={() => escolherServico(String(s.id))}
              >
                <strong>{s.nome}</strong>
                <span>
                  {formatarDuracao(s.duracao_min)} · {formatarPreco(s.preco)}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {servico && (
        <form onSubmit={enviar}>
          <section className="passo">
            <h2>
              <span className="passo-num">02</span> Horários
            </h2>

            {dias.length === 0 && (
              <p className="suave">
                Não há horários disponíveis nos próximos dias. Fala diretamente com ela (contacto
                no fim da página).
              </p>
            )}

            {dias.map(({ dia, slots }) => (
              <div className="dia" key={dia.toDateString()}>
                <h3 className="dia-titulo">
                  {dia.toLocaleDateString('pt-PT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h3>
                <div className="slots">
                  {slots.map((slot) => {
                    const iso = paraLocalISO(slot)
                    const ativo = selecionados.includes(iso)
                    return (
                      <button
                        type="button"
                        key={iso}
                        className={`slot ${ativo ? 'ativo' : ''}`}
                        aria-pressed={ativo}
                        onClick={() => alternar(iso)}
                      >
                        {pad(slot.getHours())}:{pad(slot.getMinutes())}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="passo">
            <h2>
              <span className="passo-num">03</span> Os teus dados
            </h2>
            <div className="formulario">
              <label>
                Nome
                <input
                  className="campo"
                  type="text"
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </label>
              <label>
                Telemóvel
                <input
                  className="campo"
                  type="tel"
                  autoComplete="tel"
                  value={telemovel}
                  onChange={(e) => setTelemovel(e.target.value)}
                  required
                />
              </label>
              <label>
                <span>
                  Email <span className="suave">(opcional)</span>
                </span>
                <input
                  className="campo"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <p className="resumo">
                {selecionados.length === 0
                  ? 'Ainda não escolheste nenhum horário.'
                  : `Escolheste ${selecionados.length} horário(s).`}
              </p>
              <button type="submit" className="btn btn-escuro" disabled={aEnviar}>
                {aEnviar ? 'A enviar…' : 'Enviar pedido'}
              </button>
            </div>
          </section>
        </form>
      )}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <aside className="apoio">
        <h3>Marcação especial?</h3>
        <p className="suave">Se precisas de algo que não está aqui, fala diretamente com ela.</p>
        <div className="contacto-acoes">
          <a className="btn btn-contorno" href={TELEMOVEL_LINK}>
            Ligar · {NEGOCIO.telemovel}
          </a>
          <a
            className="btn btn-contorno"
            href={linkWhatsApp(NEGOCIO.telemovel, 'Olá! Gostava de falar sobre uma marcação.')}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        </div>
      </aside>
    </div>
  )
}

export default Marcar