import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const VAZIO = { nome: '', duracao_min: 60, preco: '', descricao: '' }

function validar(s) {
  if (s.nome.trim().length < 2) return 'O nome é obrigatório.'
  const duracao = Number(s.duracao_min)
  if (!Number.isInteger(duracao) || duracao < 5 || duracao > 480) {
    return 'A duração tem de ser um número inteiro de minutos, entre 5 e 480.'
  }
  if (s.preco === '' || Number(s.preco) < 0) return 'O preço é obrigatório e não pode ser negativo.'
  return ''
}

function LinhaServico({ servico, aoAlterar }) {
  const [rascunho, setRascunho] = useState({
    nome: servico.nome,
    duracao_min: servico.duracao_min,
    preco: servico.preco,
    descricao: servico.descricao ?? '',
  })
  const [erro, setErro] = useState('')
  const [aGuardar, setAGuardar] = useState(false)

  const alterado =
    rascunho.nome !== servico.nome ||
    Number(rascunho.duracao_min) !== servico.duracao_min ||
    Number(rascunho.preco) !== Number(servico.preco) ||
    rascunho.descricao !== (servico.descricao ?? '')

  function mudar(campo, valor) {
    setRascunho({ ...rascunho, [campo]: valor })
  }

  async function guardar() {
    const mensagem = validar(rascunho)
    if (mensagem) {
      setErro(mensagem)
      return
    }
    setErro('')
    setAGuardar(true)
    const { error } = await supabase
      .from('servicos')
      .update({
        nome: rascunho.nome.trim(),
        duracao_min: Number(rascunho.duracao_min),
        preco: Number(rascunho.preco),
        descricao: rascunho.descricao.trim() || null,
      })
      .eq('id', servico.id)
    setAGuardar(false)

    if (error) setErro(error.message)
    else aoAlterar()
  }

  async function alternarAtivo() {
    const { error } = await supabase
      .from('servicos')
      .update({ ativo: !servico.ativo })
      .eq('id', servico.id)

    if (error) setErro(error.message)
    else aoAlterar()
  }
    async function apagar() {
    if (!window.confirm(`Apagar o serviço "${servico.nome}"? Não pode ser desfeito.`)) return

    const { error } = await supabase.from('servicos').delete().eq('id', servico.id)

    if (error) {
      setErro(
        error.code === '23503'
          ? 'Este serviço já tem pedidos associados e não pode ser apagado. Esconde-o em vez disso.'
          : error.message
      )
    } else {
      aoAlterar()
    }
  }

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: 12,
        marginBottom: 8,
        opacity: servico.ativo ? 1 : 0.6,
      }}
    >
      <input
        type="text"
        placeholder="Nome"
        value={rascunho.nome}
        onChange={(e) => mudar('nome', e.target.value)}
      />{' '}
      <input
        type="number"
        min="5"
        max="480"
        step="5"
        value={rascunho.duracao_min}
        onChange={(e) => mudar('duracao_min', e.target.value)}
      />{' '}
      min{' '}
      <input
        type="number"
        min="0"
        step="0.01"
        value={rascunho.preco}
        onChange={(e) => mudar('preco', e.target.value)}
      />{' '}
      €{' '}
      <input
        type="text"
        placeholder="Descrição (opcional)"
        value={rascunho.descricao}
        onChange={(e) => mudar('descricao', e.target.value)}
      />{' '}
      <button onClick={guardar} disabled={!alterado || aGuardar}>
        {aGuardar ? 'A guardar...' : 'Guardar'}
      </button>{' '}
      <button onClick={alternarAtivo}>{servico.ativo ? 'Esconder' : 'Mostrar'}</button>
      {!servico.ativo && ' · escondido do site'}
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
    </div>
  )
}

function Servicos() {
  const [servicos, setServicos] = useState([])
  const [novo, setNovo] = useState(VAZIO)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data, error } = await supabase.from('servicos').select('*').order('id')
    if (error) setErro('Erro ao carregar serviços: ' + error.message)
    else setServicos(data)
  }

  async function adicionar(e) {
    e.preventDefault()
    const mensagem = validar(novo)
    if (mensagem) {
      setErro(mensagem)
      return
    }
    const { error } = await supabase.from('servicos').insert({
      nome: novo.nome.trim(),
      duracao_min: Number(novo.duracao_min),
      preco: Number(novo.preco),
      descricao: novo.descricao.trim() || null,
    })

    if (error) {
      setErro(error.message)
    } else {
      setNovo(VAZIO)
      setErro('')
      carregar()
    }
  }

  return (
    <section>
      <h2>Serviços</h2>
      {servicos.map((s) => (
        <LinhaServico key={s.id} servico={s} aoAlterar={carregar} />
      ))}

      <h3>Adicionar serviço</h3>
      <form onSubmit={adicionar}>
        <input
          type="text"
          placeholder="Nome"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
        />{' '}
        <input
          type="number"
          min="5"
          max="480"
          step="5"
          value={novo.duracao_min}
          onChange={(e) => setNovo({ ...novo, duracao_min: e.target.value })}
        />{' '}
        min{' '}
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Preço"
          value={novo.preco}
          onChange={(e) => setNovo({ ...novo, preco: e.target.value })}
        />{' '}
        €{' '}
        <input
          type="text"
          placeholder="Descrição (opcional)"
          value={novo.descricao}
          onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
        />{' '}
        <button type="submit">Adicionar</button>
      </form>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
    </section>
  )
}

export default Servicos