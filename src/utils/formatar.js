export function formatarPreco(valor) {
  const n = Number(valor)
  const texto = Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',')
  return `${texto} €`
}

export function formatarDuracao(min) {
  if (min < 60) return `${min} min`
  const horas = Math.floor(min / 60)
  const resto = min % 60
  return `${horas}h${resto ? String(resto).padStart(2, '0') : ''}`
}