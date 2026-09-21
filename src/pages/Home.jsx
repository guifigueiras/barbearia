import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function Home() {
  const [servicos, setServicos] = useState([])

  useEffect(() => {
    async function buscarServicos() {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')

      if (error) {
        console.error('Erro ao buscar serviços:', error)
      } else {
        setServicos(data)
      }
    }

    buscarServicos()
  }, [])

  return (
    <div>
      <h1>Bem-vindo</h1>
      <p>Apresentação da barbeira, estilo de trabalho, etc.</p>

      <h2>Serviços</h2>
      <ul>
        {servicos.map((servico) => (
          <li key={servico.id}>
            {servico.nome} — {servico.duracao_min} min — {servico.preco}€
          </li>
        ))}
      </ul>

      <h2>Galeria</h2>
      <h2>Galeria</h2>
<div style={{ display: 'flex', gap: '10px' }}>
  <img src="/gallery/img1.jpg" width="150" />
  <img src="/gallery/img2.jpg" width="150" />
</div>
    </div>
  )
}

export default Home