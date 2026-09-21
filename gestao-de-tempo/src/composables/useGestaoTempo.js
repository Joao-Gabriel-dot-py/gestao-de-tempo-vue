import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'gestao-tempo-planilha-v1'

// Estado compartilhado (singleton)
const columns = ref([])
const rows = ref([])
const carregando = ref(false)
const erro = ref(null)
let inicializado = false

// ==========================================
// Valores padrão
// ==========================================

function getExcelColumnName(index) {
  let name = ''
  let num = index + 1
  while (num > 0) {
    const rem = (num - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    num = Math.floor((num - 1) / 26)
  }
  return name
}

function criarColunasPadrao() {
  return [
    { id: 'col_0', label: 'Domingo' },
    { id: 'col_1', label: 'Segunda' },
    { id: 'col_2', label: 'Terça' },
    { id: 'col_3', label: 'Quarta' },
    { id: 'col_4', label: 'Quinta' },
    { id: 'col_5', label: 'Sexta' },
    { id: 'col_6', label: 'Sábado' },
  ]
}

function criarLinhasPadrao() {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `row_${i}`,
    time: `${String(i + 8).padStart(2, '0')}:00`,
    data: {},
    colors: {},
  }))
}

// ==========================================
// Supabase helpers
// ==========================================

async function carregarPlanilhaDoSupabase() {
  const { data, error } = await supabase
    .from('planilhas')
    .select('*')
    .eq('nome', 'principal')
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data
}

async function salvarPlanilhaNoSupabase(colunas, linhas) {
  const payload = {
    nome: 'principal',
    colunas: JSON.stringify(colunas),
    linhas: JSON.stringify(linhas),
    atualizado_em: new Date().toISOString(),
  }

  // Upsert: insere ou atualiza se já existe
  const { error } = await supabase
    .from('planilhas')
    .upsert(payload, { onConflict: 'nome' })

  if (error) throw error
}

// ==========================================
// localStorage (cache local permanente)
// ==========================================

function salvarNoLocalStorage() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ columns: columns.value, rows: rows.value })
  )
}

function carregarDoLocalStorage() {
  const salvo = localStorage.getItem(STORAGE_KEY)
  columns.value = criarColunasPadrao()

  if (salvo) {
    try {
      const parsed = JSON.parse(salvo)
      rows.value = parsed.rows || criarLinhasPadrao()
    } catch {
      rows.value = criarLinhasPadrao()
    }
  } else {
    rows.value = criarLinhasPadrao()
  }
}

// ==========================================
// Debounce: salva SEMPRE no localStorage + tenta Supabase
// ==========================================

let saveTimeout = null
function salvarComDebounce() {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    // Sempre persiste localmente
    salvarNoLocalStorage()

    // Tenta sincronizar com Supabase (falha silenciosa se offline)
    if (supabase) {
      try {
        await salvarPlanilhaNoSupabase(columns.value, rows.value)
      } catch (e) {
        console.warn('[Offline] Supabase indisponível, dados salvos localmente:', e.message)
      }
    }
  }, 1000)
}

// ==========================================
// Inicialização (local-first)
// ==========================================

async function inicializarPlanilha() {
  if (inicializado) return
  inicializado = true
  carregando.value = true
  erro.value = null

  // 1. Sempre carrega do localStorage primeiro (instantâneo)
  carregarDoLocalStorage()

  // 2. Configura watcher para salvar em ambos
  watch([columns, rows], salvarComDebounce, { deep: true })

  // 3. Tenta sincronizar com Supabase em background
  if (supabase) {
    try {
      const planilha = await carregarPlanilhaDoSupabase()
      if (planilha) {
        columns.value = criarColunasPadrao()
        rows.value = JSON.parse(planilha.linhas)
        // Atualiza o cache local com dados frescos do servidor
        salvarNoLocalStorage()
      }
    } catch (e) {
      console.warn('[Offline] Não foi possível sincronizar com Supabase:', e.message)
      // Dados do localStorage já estão carregados, tudo certo
    }
  }

  carregando.value = false
}

// ==========================================
// Composable export
// ==========================================

export function useGestaoTempo() {
  inicializarPlanilha()

  function addColumn() {
    const newIndex = columns.value.length
    const newId = `col_${Date.now()}_${newIndex}`
    columns.value.push({
      id: newId,
      label: getExcelColumnName(newIndex),
    })
  }

  function removeColumn() {
    if (columns.value.length > 1) {
      const removed = columns.value.pop()
      rows.value.forEach((row) => {
        delete row.data[removed.id]
        if (row.colors) delete row.colors[removed.id]
      })
    }
  }

  function addRow() {
    const newId = `row_${Date.now()}_${rows.value.length}`
    rows.value.push({ id: newId, time: '', data: {}, colors: {} })
  }

  function removeRow() {
    if (rows.value.length > 1) {
      rows.value.pop()
    }
  }

  function clearAll() {
    rows.value.forEach((row) => {
      row.data = {}
      row.colors = {}
    })
  }

  return {
    columns,
    rows,
    carregando,
    erro,
    getExcelColumnName,
    addColumn,
    removeColumn,
    addRow,
    removeRow,
    clearAll,
  }
}
