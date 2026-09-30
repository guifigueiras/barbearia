const PASSO_MIN = 30      // de quantos em quantos minutos começam os horários
const DIAS_A_FRENTE = 14  // quantos dias mostrar

export function pad(n) {
  return String(n).padStart(2, '0')
}

// Date -> "2026-10-01T14:00:00" na hora local (sem converter para UTC)
export function paraLocalISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

// "2026-10-01T14:00:00" ou "2026-10-01 14:00:00" -> Date local
export function deLocalISO(str) {
  return new Date(str.replace(' ', 'T'))
}

// "09:00:00" -> 540 (minutos desde a meia-noite)
function minutos(hhmmss) {
  const [h, m] = hhmmss.split(':')
  return Number(h) * 60 + Number(m)
}

/**
 * Devolve uma lista de dias, cada um com os horários livres:
 * [{ dia: Date, slots: [Date, Date, ...] }, ...]
 */
export function gerarSlots({ duracaoMin, disponibilidade, bloqueios, ocupados }) {
  const agora = new Date()
  const impedidos = [
    ...bloqueios.map((b) => [deLocalISO(b.inicio), deLocalISO(b.fim)]),
    ...ocupados.map((o) => [deLocalISO(o.inicio), deLocalISO(o.fim)]),
  ]

  const resultado = []

  for (let i = 0; i < DIAS_A_FRENTE; i++) {
    const dia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i)
    const diaSemana = (dia.getDay() + 6) % 7 // JS: 0=domingo -> nós: 0=segunda
    const horarios = disponibilidade.filter((d) => d.dia_semana === diaSemana)
    const slots = []

    for (const h of horarios) {
      const abre = minutos(h.hora_inicio)
      const fecha = minutos(h.hora_fim)

      for (let m = abre; m + duracaoMin <= fecha; m += PASSO_MIN) {
        const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, m)
        const fim = new Date(inicio.getTime() + duracaoMin * 60000)

        if (inicio <= agora) continue // já passou

        const colide = impedidos.some(([a, b]) => inicio < b && a < fim)
        if (!colide) slots.push(inicio)
      }
    }

    if (slots.length > 0) resultado.push({ dia, slots })
  }

  return resultado
}