// Dados do negócio: muda só este ficheiro.
export const NEGOCIO = {
  nome: 'Bruanna Studio', // como aparece escrito no site
  frase: 'Cortes com identidade e alma.',
  instagramUser: 'Jbruanna', // sem o @
  telemovel: '933752709', // como aparece escrito no site
  zona: 'Famões / Rua do Centro Comunitário Paroquial',
}

// Nomes dos ficheiros que estão em public/gallery
export const FOTOS = ['img1.jpg', 'img2.jpg']

export const INSTAGRAM_URL = `https://www.instagram.com/${NEGOCIO.instagramUser}/`
export const TELEMOVEL_LINK = `tel:${NEGOCIO.telemovel.replace(/\s/g, '')}`