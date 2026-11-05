// Pequenas funções partilhadas pela página inicial (Home) e pelo painel (GaleriaAdmin).
import { supabase } from '../supabaseClient'

// Nome do bucket criado no SQL (01-galeria.sql).
export const BUCKET = 'galeria'

// Converte o "caminho" guardado na tabela (ex.: "a1b2.jpg") no link completo da imagem.
export function urlFoto(caminho) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho)
  return data.publicUrl
}
