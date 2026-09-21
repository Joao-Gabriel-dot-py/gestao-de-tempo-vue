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

// Debounce para não salvar a cada keypress
let saveTimeout = null
function salvarComDebounce() {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    if (!supabase) return
    try {
      await salvarPlanilhaNoSupabase(columns.value, rows.value)
    } catch (e) {
      console.error('[Supabase] Erro ao salvar planilha:', e)
      erro.value = e.message
    }
  }, 1000) // Salva 1s após a última alteração
}

// ==========================================
// Inicialização
// ==========================================

async function inicializarPlanilha() {
  if (inicializado) return
  inicializado = true
  carregando.value = true
  erro.value = null

  try {
    if (supabase) {
      const planilha = await carregarPlanilhaDoSupabase()
      columns.value = criarColunasPadrao() // Sempre usa colunas fixas
      if (planilha) {
        rows.value = JSON.parse(planilha.linhas)
      } else {
        rows.value = criarLinhasPadrao()
      }

      // Watcher para salvar no Supabase com debounce
      watch([columns, rows], salvarComDebounce, { deep: true })
    } else {
      carregarDoLocalStorage()
      configurarWatchersLocalStorage()
    }
  } catch (e) {
    console.error('[Supabase] Erro ao carregar planilha, usando localStorage:', e)
    erro.value = e.message
    carregarDoLocalStorage()
    configurarWatchersLocalStorage()
  } finally {
    carregando.value = false
  }
}

// ==========================================
// localStorage (fallback)
// ==========================================

function carregarDoLocalStorage() {
  const salvo = localStorage.getItem(STORAGE_KEY)
  columns.value = criarColunasPadrao() // Sempre usa colunas fixas

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

function configurarWatchersLocalStorage() {
  watch(
    [columns, rows],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ columns: columns.value, rows: rows.value })
      )
    },
    { deep: true }
  )
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
