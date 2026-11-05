import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { NEGOCIO, INSTAGRAM_URL, TELEMOVEL_LINK } from '../config'
import { formatarPreco, formatarDuracao } from '../utils/formatar'
import { linkWhatsApp } from '../utils/whatsapp'
import { urlFoto } from '../utils/galeria'
import AvisoCancelamento from '../components/AvisoCancelamento'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

// Para cada dia da semana, a lista de turnos ("10:00–13:00") ou vazio se fechado
function organizarHorario(disponibilidade) {
  return DIAS.map((nome, i) => ({
    nome,
    turnos: disponibilidade
      .filter((d) => d.dia_semana === i)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
      .map((d) => `${d.hora_inicio.slice(0, 5)}–${d.hora_fim.slice(0, 5)}`),
  }))
}

function Home() {
  const [servicos, setServicos] = useState([])
  const [disponibilidade, setDisponibilidade] = useState([])
  const [fotos, setFotos] = useState([]) // fotos da galeria, geridas pela barbeira no /admin

  useEffect(() => {
    async function carregar() {
      const [s, d, f] = await Promise.all([
        supabase.from('servicos').select('*').eq('ativo', true).order('id'),
        supabase.from('disponibilidade').select('*'),
        supabase.from('fotos').select('id, caminho').order('criado_em', { ascending: false }),
      ])
      if (s.error) console.error('Erro ao buscar serviços:', s.error)
      else setServicos(s.data)
      if (d.error) console.error('Erro ao buscar horário:', d.error)
      else setDisponibilidade(d.data)
      if (f.error) console.error('Erro ao buscar fotos:', f.error)
      else setFotos(f.data)
    }
    carregar()
  }, [])

  const horario = organizarHorario(disponibilidade)

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="etiqueta">Barbearia · {NEGOCIO.zona}</p>
          <h1>{NEGOCIO.frase}</h1>
          <div className="hero-acoes">
            <Link to="/marcar" className="btn btn-claro">
              Marcar um corte
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-contorno-claro"
            >
              Ver  mais exemplos no Instagram
            </a>
          </div>
        </div>
      </section>

      <section className="seccao" id="servicos">
        <div className="container">
          <h2>Serviços</h2>
          <ul className="lista-servicos">
            {servicos.map((s) => (
              <li key={s.id}>
                <div>
                  <h3>{s.nome}</h3>
                  {s.descricao && <p className="suave">{s.descricao}</p>}
                </div>
                <div className="servico-meta">
                  <span className="suave">{formatarDuracao(s.duracao_min)}</span>
                  <strong>{formatarPreco(s.preco)}</strong>
                </div>
              </li>
            ))}
          </ul>
          <AvisoCancelamento />
        </div>
      </section>

      <section className="seccao seccao-cinza" id="galeria">
        <div className="container">
          <h2>Trabalhos</h2>
          {fotos.length > 0 && (
            <>
              <div className="galeria" role="region" aria-label="Galeria de trabalhos">
                {fotos.map((foto) => (
                  <img
                    key={foto.id}
                    src={urlFoto(foto.caminho)}
                    alt="Corte feito na barbearia"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
              <p className="dica-deslizar suave">Desliza para ver mais →</p>
            </>
          )}
          <p className="galeria-link">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              Ver mais no Instagram →
            </a>
          </p>
        </div>
      </section>

      <section className="seccao" id="contacto">
        <div className="container duas-colunas">
          <div>
            <h2>Horário</h2>
            <ul className="horario">
              {horario.map((dia) => (
                <li key={dia.nome}>
                  <span>{dia.nome}</span>
                  <span className={dia.turnos.length ? '' : 'suave'}>
                    {dia.turnos.length ? dia.turnos.join(' · ') : 'Fechado'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Contacto</h2>
            <p>
              Precisas de uma marcação especial ou tens alguma dúvida? Fala diretamente comigo.
            </p>
            <div className="contacto-acoes">
              <a className="btn btn-escuro" href={TELEMOVEL_LINK}>
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
              <a className="btn btn-contorno" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home