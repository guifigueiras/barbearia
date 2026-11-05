import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { BUCKET, urlFoto } from '../utils/galeria'
import './admin-fotos.css'

// Antes de enviar, cada foto é reduzida no próprio browser.
// Uma foto de telemóvel pesa 3-8 MB; depois de reduzida fica com ~200-400 KB.
// É isto que faz o plano gratuito do Supabase (1 GB de ficheiros) chegar para muito tempo.
const LADO_MAXIMO = 1600 // px: o lado maior da foto fica com no máximo isto
const QUALIDADE = 0.82 // 0 a 1; 0.82 mantém boa qualidade com ficheiro pequeno

async function reduzirFoto(ficheiro) {
  // Lê a foto já com a rotação correta (fotos de telemóvel trazem a orientação nos metadados).
  const imagem = await createImageBitmap(ficheiro)

  // escala = quanto temos de encolher. Math.min(1, ...) garante que nunca ampliamos fotos pequenas.
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height))
  const largura = Math.round(imagem.width * escala)
  const altura = Math.round(imagem.height * escala)

  // O canvas é uma "tela" invisível onde desenhamos a foto já no tamanho novo.
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // fundo branco: PNGs transparentes não ficam pretos ao passar a JPEG
  ctx.fillRect(0, 0, largura, altura)
  ctx.drawImage(imagem, 0, 0, largura, altura)
  imagem.close()

  // toBlob devolve o resultado como ficheiro (Blob) em JPEG.
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível processar a imagem'))),
      'image/jpeg',
      QUALIDADE
    )
  })
}

function GaleriaAdmin() {
  const [fotos, setFotos] = useState([]) // lista de fotos vinda da base de dados
  const [aCarregar, setACarregar] = useState(true) // true enquanto a lista inicial não chegou
  const [aEnviar, setAEnviar] = useState(false) // true durante o envio de fotos novas
  const [aApagar, setAApagar] = useState(null) // id da foto que está a ser apagada (ou null)
  const [erro, setErro] = useState('') // mensagem de erro a mostrar (texto vazio = sem erro)

  async function carregar() {
    const { data, error } = await supabase
      .from('fotos')
      .select('id, caminho, criado_em')
      .order('criado_em', { ascending: false }) // mais recentes primeiro
    if (error) {
      setErro('Não foi possível carregar as fotos. Tenta recarregar a página.')
    } else {
      setFotos(data)
    }
    setACarregar(false)
  }

  // [] no fim = corre uma única vez, quando o componente aparece no ecrã.
  useEffect(() => {
    carregar()
  }, [])

  async function aoEscolherFicheiros(e) {
    const ficheiros = Array.from(e.target.files) // FileList -> array normal
    e.target.value = '' // limpa o campo, para poder escolher a mesma foto outra vez
    if (ficheiros.length === 0) return

    setAEnviar(true)
    setErro('')
    const falhadas = []

    // Enviamos uma de cada vez (mais simples e não sobrecarrega a ligação do telemóvel).
    for (const ficheiro of ficheiros) {
      try {
        const blob = await reduzirFoto(ficheiro)
        const caminho = `${crypto.randomUUID()}.jpg` // nome único, para nunca haver dois iguais

        // 1) envia o ficheiro para o Storage
        const { error: erroUpload } = await supabase.storage
          .from(BUCKET)
          .upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
        if (erroUpload) throw erroUpload

        // 2) regista a foto na tabela (é daqui que o site sabe que ela existe)
        const { error: erroTabela } = await supabase.from('fotos').insert({ caminho })
        if (erroTabela) {
          await supabase.storage.from(BUCKET).remove([caminho]) // desfaz o passo 1 para não ficar lixo
          throw erroTabela
        }
      } catch {
        falhadas.push(ficheiro.name)
      }
    }

    if (falhadas.length > 0) {
      setErro(`Não foi possível enviar: ${falhadas.join(', ')}. Tenta outra vez.`)
    }
    await carregar()
    setAEnviar(false)
  }

  async function apagar(foto) {
    if (!window.confirm('Apagar esta foto do site? Esta ação não pode ser desfeita.')) return

    setAApagar(foto.id)
    setErro('')

    // Primeiro apaga o ficheiro; só depois a linha da tabela.
    // Assim, se algo falhar a meio, a foto continua visível e pode tentar outra vez.
    const { error: erroFicheiro } = await supabase.storage.from(BUCKET).remove([foto.caminho])
    if (erroFicheiro) {
      setErro('Não foi possível apagar a foto. Tenta outra vez.')
      setAApagar(null)
      return
    }
    const { error: erroTabela } = await supabase.from('fotos').delete().eq('id', foto.id)
    if (erroTabela) {
      setErro('Não foi possível apagar a foto. Tenta outra vez.')
    } else {
      // Tira a foto da lista no ecrã sem ter de ir buscar tudo outra vez.
      setFotos((atuais) => atuais.filter((f) => f.id !== foto.id))
    }
    setAApagar(null)
  }

  return (
    <section>
      <h2>Fotos do site</h2>
      <p className="suave">
        Adiciona ou apaga as fotos da galeria “Trabalhos”. As alterações ficam logo visíveis no site.
      </p>

      {/* O <label> funciona como botão: clicar nele abre o seletor de ficheiros. */}
      <label className="btn btn-escuro" style={{ opacity: aEnviar ? 0.6 : 1 }}>
        {aEnviar ? 'A enviar…' : '+ Adicionar fotos'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={aoEscolherFicheiros}
          disabled={aEnviar}
          hidden
        />
      </label>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      {aCarregar ? (
        <p className="suave">A carregar…</p>
      ) : fotos.length === 0 ? (
        <p className="suave">Ainda não há fotos. Clica em “Adicionar fotos” para começar.</p>
      ) : (
        <ul className="fotos-admin-grelha">
          {fotos.map((foto) => (
            <li key={foto.id}>
              <img src={urlFoto(foto.caminho)} alt="" loading="lazy" />
              <button
                type="button"
                className="btn btn-contorno"
                onClick={() => apagar(foto)}
                disabled={aApagar === foto.id}
                aria-label="Apagar foto"
              >
                {aApagar === foto.id ? 'A apagar…' : 'Apagar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default GaleriaAdmin
