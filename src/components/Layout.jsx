import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
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
  return (
    <>
      <ScrollParaOTopo />

      <header className="cabecalho">
        <div className="container cabecalho-interior">
          <Link to="/" className="logo">
            {NEGOCIO.nome}
          </Link>
          <Link to="/marcar" className="btn btn-escuro btn-pequeno">
            Marcar
          </Link>
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