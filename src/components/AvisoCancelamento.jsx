// Aviso da política de desmarcação. O texto está só aqui: se ela quiser mudá-lo,
// muda-se neste ficheiro e atualiza em todo o site (Home e formulário de marcação).
// Usa a classe "aviso-horarios" que já tens, para ficar com o mesmo aspeto das outras notas do site.
function AvisoCancelamento() {
  return (
    <div className="aviso-horarios" role="note">
      <p>
        <strong>Política de desmarcação.</strong> As sessões só podem ser desmarcadas com, no mínimo,
        24 horas de antecedência. Desmarcações feitas com menos de 24 horas ficam sujeitas a uma
        taxa de 50% do valor da sessão marcada.
      </p>
    </div>
  )
}

export default AvisoCancelamento
