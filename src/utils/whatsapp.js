import { deLocalISO, pad } from './slots'

// "+351 912 345 678", "912345678" ou "00351912345678" -> "351912345678"
// (o WhatsApp quer só dígitos, com indicativo do país)
export function normalizarTelemovel(telemovel) {
  let n = telemovel.replace(/\D/g, '')
  if (n.startsWith('00')) n = n.slice(2)
  if (n.length === 9) n = '351' + n // número português sem indicativo
  return n
}

export function linkWhatsApp(telemovel, mensagem) {
  return `https://wa.me/${normalizarTelemovel(telemovel)}?text=${encodeURIComponent(mensagem)}`
}

function descreverData(d) {
  const dia = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
  return `${dia}, às ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Escolhe a mensagem conforme o estado do pedido
export function mensagemPedido(p) {
  const nome = p.nome_cliente.trim().split(' ')[0]
  const servico = p.servicos?.nome ?? 'marcação'
  const marcar = `${window.location.origin}/marcar`

  if (p.estado === 'confirmado') {
    return `Olá ${nome}! A tua marcação (${servico}) está confirmada para ${descreverData(deLocalISO(p.inicio_confirmado))}. Até lá!`
  }
  if (p.estado === 'cancelado') {
    return `Olá ${nome}, peço desculpa mas tive de cancelar a tua marcação (${servico}). Podes escolher outro horário aqui: ${marcar}`
  }
  if (p.estado === 'recusado') {
    return `Olá ${nome}! Obrigada pelo teu pedido (${servico}), mas não consegui encaixar nenhum dos horários que indicaste. Podes escolher outros aqui: ${marcar}`
  }
  // pendente: perguntar se o cliente pode noutra hora
  return `Olá ${nome}! Recebi o teu pedido (${servico}). Consegues vir noutro horário? Diz-me o que te dá jeito.`
}