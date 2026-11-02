import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { NEGOCIO, INSTAGRAM_URL, TELEMOVEL_LINK } from '../config'

// Ao mudar de página, volta ao topo (senão ficava a meio da página anterior)
function ScrollParaOTopo() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Layout() {
  const [temSessao, setTemSessao] = useState(false)

  // Só quem tem sessão iniciada vê o link "Painel" no cabeçalho
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setTemSessao(!!data.session))

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setTemSessao(!!sessao)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <>
      <ScrollParaOTopo />

      <header className="cabecalho">
        <div className="container cabecalho-interior">
          <Link to="/" className="logo">
            {NEGOCIO.nome}
          </Link>
          <div className="cabecalho-acoes">
            {temSessao && (
              <Link to="/admin" className="link-painel">
                Painel
              </Link>
            )}
            <Link to="/marcar" className="btn btn-escuro btn-pequeno">
              Marcar
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="rodape">
        <div className="container rodape-interior">
          <div>
            <p className="logo">{NEGOCIO.nome}</p>
            <p className="suave">{NEGOCIO.zona}</p>
          </div>
          <div className="rodape-links">
            <a href={TELEMOVEL_LINK}>{NEGOCIO.telemovel}</a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              Instagram @{NEGOCIO.instagramUser}
            </a>
            <Link to="/admin" className="link-discreto">
              Área reservada
            </Link>
          </div>
        </div>
        <p className="container direitos">
          © {new Date().getFullYear()} {NEGOCIO.nome}
        </p>
      </footer>
    </>
  )
}

export default Layout