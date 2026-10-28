// Dados do negócio: muda só este ficheiro.
export const NEGOCIO = {
  nome: 'Nome da Barbearia',
  frase: 'Cortes feitos com tempo e atenção ao detalhe.',
  instagramUser: 'o_instagram_dela', // sem o @
  telemovel: '912 345 678', // como aparece escrito no site
  zona: 'Zona / morada',
}

// Nomes dos ficheiros que estão em public/gallery
export const FOTOS = ['img1.jpg', 'img2.jpg']

export const INSTAGRAM_URL = `https://www.instagram.com/${NEGOCIO.instagramUser}/`
export const TELEMOVEL_LINK = `tel:${NEGOCIO.telemovel.replace(/\s/g, '')}`