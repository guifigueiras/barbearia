import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { deLocalISO, pad } from '../utils/slots'

// Um horário "junta" com uma marcação se estiver a esta distância ou menos
const MARGEM_JUNTAR_MIN = 60

function formatar(d) {
  const dia = d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${dia}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function colide(inicio1, fim1, inicio2, fim2) {
  return inicio1 < fim2 && inicio2 < fim1
}

function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [bloqueios, setBloqueios] = useState([])
  const [aCarregar, setACarregar] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const [p, b] = await Promise.all([
      supabase
        .from('pedidos')
        .select('*, servicos(nome), pedido_slots(inicio_proposto)')
        .in('estado', ['pendente', 'confirmado'])
        .order('criado_em'),
      supabase.from('bloqueios').select('inicio, fim'),
    ])

    if (p.error || b.error) {
      setErro('Erro ao carregar pedidos: ' + (p.error?.message || b.error?.message))
    } else {
      setPedidos(p.data)
      setBloqueios(b.data)
      setErro('')
    }
    setACarregar(false)
  }

  const agora = new Date()

  const confirmadas = pedidos
    .filter((p) => p.estado === 'confirmado' && p.inicio_confirmado)
    .map((p) => {
      const inicio = deLocalISO(p.inicio_confirmado)
      return { ...p, inicio, fim: new Date(inicio.getTime() + p.duracao_min * 60000) }
    })
    .filter((p) => p.fim > agora)
    .sort((a, b) => a.inicio - b.inicio)

  const pendentes = pedidos.filter((p) => p.estado === 'pendente')
  const intervalosBloqueados = bloqueios.map((b) => [deLocalISO(b.inicio), deLocalISO(b.fim)])

  // Para cada horário proposto, descobre o que a barbeira precisa de saber
  function analisarSlot(pedido, iso) {
    const inicio = deLocalISO(iso)
    const fim = new Date(inicio.getTime() + pedido.duracao_min * 60000)
    const margem = MARGEM_JUNTAR_MIN * 60000

    const passado = inicio <= agora
    const bloqueado = intervalosBloqueados.some(([a, b]) => colide(inicio, fim, a, b))
    const ocupado = confirmadas.some((c) => colide(inicio, fim, c.inicio, c.fim))
    const junta =
      !ocupado &&
      confirmadas.some(
        (c) => Math.abs(inicio - c.fim) <= margem || Math.abs(c.inicio - fim) <= margem
      )
    const concorrentes = pendentes
      .filter((o) => o.id !== pedido.id && o.pedido_slots.some((s) => s.inicio_proposto === iso))
      .map((o) => o.nome_cliente)

    return { inicio, passado, bloqueado, ocupado, junta, concorrentes }
  }

  async function confirmar(pedido, iso) {
    const { error } = await supabase.rpc('confirmar_pedido', {
      p_pedido_id: pedido.id,
      p_inicio: iso,
    })
    if (error) alert(error.message)
    carregar()
  }

  async function mudarEstado(pedido, estado, pergunta) {
    if (!window.confirm(pergunta)) return
    const { error } = await supabase.from('pedidos').update({ estado }).eq('id', pedido.id)
    if (error) alert(error.message)
    carregar()
  }

  if (aCarregar) return <p>A carregar pedidos...</p>

  return (
    <section>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <h2>Pedidos pendentes ({pendentes.length})</h2>
      {pendentes.length === 0 && <p>Sem pedidos pendentes.</p>}

      {pendentes.map((p) => {
        const slots = p.pedido_slots.map((s) => s.inicio_proposto).sort()
        return (
          <div key={p.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12 }}>
            <strong>{p.nome_cliente}</strong> — {p.servicos?.nome} ({p.duracao_min} min)
            <br />
            <a href={`tel:${p.telemovel}`}>{p.telemovel}</a>
            {p.email && <> · {p.email}</>}

            <ul>
              {slots.map((iso) => {
                const a = analisarSlot(p, iso)
                const indisponivel = a.passado || a.bloqueado || a.ocupado
                return (
                  <li key={iso}>
                    {formatar(a.inicio)}{' '}
                    <button disabled={indisponivel} onClick={() => confirmar(p, iso)}>
                      Confirmar
                    </button>
                    {a.passado && ' · já passou'}
                    {a.bloqueado && ' · colide com um bloqueio'}
                    {a.ocupado && ' · colide com uma marcação confirmada'}
                    {a.junta && ' · ✓ junta com outra marcação'}
                    {a.concorrentes.length > 0 &&
                      ` · também pedido por ${a.concorrentes.join(', ')}`}
                  </li>
                )
              })}
            </ul>

            <button
              onClick={() =>
                mudarEstado(p, 'recusado', `Recusar o pedido de ${p.nome_cliente}?`)
              }
            >
              Recusar pedido
            </button>
          </div>
        )
      })}

      <h2>Marcações confirmadas ({confirmadas.length})</h2>
      {confirmadas.length === 0 && <p>Sem marcações confirmadas.</p>}
      <ul>
        {confirmadas.map((c) => (
          <li key={c.id}>
            {formatar(c.inicio)} — {c.nome_cliente} ({c.servicos?.nome}) —{' '}
            <a href={`tel:${c.telemovel}`}>{c.telemovel}</a>{' '}
            <button
              onClick={() =>
                mudarEstado(c, 'cancelado', `Cancelar a marcação de ${c.nome_cliente}?`)
              }
            >
              Cancelar
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Pedidos