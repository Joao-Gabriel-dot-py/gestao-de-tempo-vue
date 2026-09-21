import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'

const STORAGE_TAREFAS = 'gestao-tempo-tarefas-v1'
const STORAGE_MISSOES = 'gestao-tempo-missoes-v1'

// Estado compartilhado (singleton no módulo)
const tarefas = ref([])
const missoes = ref([])
const carregando = ref(false)
const erro = ref(null)
let inicializado = false

// ==========================================
// Helpers de persistência (Supabase ou localStorage)
// ==========================================

async function carregarDoSupabase(tabela) {
  const { data, error } = await supabase
    .from(tabela)
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data || []
}

async function inserirNoSupabase(tabela, registro) {
  const { data, error } = await supabase
    .from(tabela)
    .insert(registro)
    .select()
    .single()
  if (error) throw error
  return data
}

async function atualizarNoSupabase(tabela, id, campos) {
  const { data, error } = await supabase
    .from(tabela)
    .update(campos)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

async function excluirNoSupabase(tabela, id) {
  const { error } = await supabase
    .from(tabela)
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ==========================================
// localStorage (cache local permanente)
// ==========================================

function salvarTarefasNoLocalStorage() {
  localStorage.setItem(STORAGE_TAREFAS, JSON.stringify(tarefas.value))
}

function salvarMissoesNoLocalStorage() {
  localStorage.setItem(STORAGE_MISSOES, JSON.stringify(missoes.value))
}

function salvarTudoNoLocalStorage() {
  salvarTarefasNoLocalStorage()
  salvarMissoesNoLocalStorage()
}

function carregarDoLocalStorage() {
  // Missões
  const missoesSalvas = localStorage.getItem(STORAGE_MISSOES)
  if (missoesSalvas) {
    try {
      missoes.value = JSON.parse(missoesSalvas)
    } catch {
      carregarMissoesPadrao()
    }
  } else {
    carregarMissoesPadrao()
  }

  // Tarefas
  const tarefasSalvas = localStorage.getItem(STORAGE_TAREFAS)
  if (tarefasSalvas) {
    try {
      tarefas.value = JSON.parse(tarefasSalvas)
    } catch {
      carregarTarefasPadrao()
    }
  } else {
    carregarTarefasPadrao()
  }
}

// Watcher: sempre persiste localmente a cada mudança
function configurarWatchers() {
  watch(missoes, salvarMissoesNoLocalStorage, { deep: true })
  watch(tarefas, salvarTarefasNoLocalStorage, { deep: true })
}

function carregarMissoesPadrao() {
  missoes.value = [
    {
      id: 'missao_1',
      nome: 'Mestre do Foco Semanal',
      descricao: 'Organizar blocos diários de alta concentração e eliminar a procrastinação.',
      xpMeta: 100,
      xpPorTarefa: 25,
      criadoEm: new Date().toISOString(),
    },
    {
      id: 'missao_2',
      nome: 'Rotina de Estudos & Prática',
      descricao: 'Dedicar horas de aprendizado contínuo para dominar novas habilidades.',
      xpMeta: 100,
      xpPorTarefa: 25,
      criadoEm: new Date().toISOString(),
    },
  ]
}

function carregarTarefasPadrao() {
  tarefas.value = [
    {
      id: 'quest_1',
      nomeTarefa: 'Planejar cronograma semanal',
      descricaoTarefas: 'Definir os blocos de foco para as metas principais da semana e priorizar atividades de alto impacto.',
      dataTarefa: new Date().toISOString().split('T')[0],
      missaoId: 'missao_1',
      concluida: false,
      criadoEm: new Date().toISOString(),
    },
    {
      id: 'quest_2',
      nomeTarefa: 'Revisar matriz de prioridades',
      descricaoTarefas: 'Separar o que é urgente do que é importante para evitar procrastinação.',
      dataTarefa: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      missaoId: 'missao_1',
      concluida: false,
      criadoEm: new Date().toISOString(),
    },
  ]
}

// ==========================================
// Mapeamento DB <-> App
// (converte snake_case do DB para camelCase do app e vice-versa)
// ==========================================

function mapTarefaDoDb(row) {
  return {
    id: row.id,
    nomeTarefa: row.nome_tarefa,
    descricaoTarefas: row.descricao_tarefas || '',
    dataTarefa: row.data_tarefa || '',
    missaoId: row.missao_id || '',
    concluida: row.concluida || false,
    criadoEm: row.criado_em,
  }
}

function mapTarefaParaDb(tarefa) {
  return {
    nome_tarefa: tarefa.nomeTarefa,
    descricao_tarefas: tarefa.descricaoTarefas || '',
    data_tarefa: tarefa.dataTarefa || null,
    missao_id: tarefa.missaoId || null,
    concluida: tarefa.concluida || false,
  }
}

function mapMissaoDoDb(row) {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao || '',
    xpMeta: row.xp_meta,
    xpPorTarefa: row.xp_por_tarefa,
    criadoEm: row.criado_em,
  }
}

function mapMissaoParaDb(missao) {
  return {
    nome: missao.nome,
    descricao: missao.descricao || '',
    xp_meta: missao.xpMeta,
    xp_por_tarefa: missao.xpPorTarefa,
  }
}

// ==========================================
// Inicialização (local-first)
// ==========================================

async function inicializarDados() {
  if (inicializado) return
  inicializado = true
  carregando.value = true
  erro.value = null

  // 1. Sempre carrega do localStorage primeiro (instantâneo)
  carregarDoLocalStorage()

  // 2. Configura watchers para persistir localmente a cada mudança
  configurarWatchers()

  // 3. Tenta sincronizar com Supabase em background
  if (supabase) {
    try {
      const [missoesBd, tarefasBd] = await Promise.all([
        carregarDoSupabase('missoes'),
        carregarDoSupabase('tarefas'),
      ])
      missoes.value = missoesBd.map(mapMissaoDoDb)
      tarefas.value = tarefasBd.map(mapTarefaDoDb)
      // Atualiza cache local com dados frescos
      salvarTudoNoLocalStorage()
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

export function useGamificacao() {
  inicializarDados()

  // --- CRUD Missões ---
  async function criarMissao(dados) {
    const nova = {
      id: `missao_${Date.now()}`,
      nome: dados.nome.trim(),
      descricao: (dados.descricao || '').trim(),
      xpMeta: Number(dados.xpMeta) || 100,
      xpPorTarefa: Number(dados.xpPorTarefa) || 25,
      criadoEm: new Date().toISOString(),
    }

    // Sempre salva localmente primeiro
    missoes.value.unshift(nova)

    // Tenta sincronizar com Supabase
    if (supabase) {
      try {
        const dbData = await inserirNoSupabase('missoes', mapMissaoParaDb(nova))
        // Atualiza o ID local com o ID do banco
        const index = missoes.value.findIndex((m) => m.id === nova.id)
        if (index !== -1) {
          missoes.value[index] = mapMissaoDoDb(dbData)
        }
      } catch (e) {
        console.warn('[Offline] Missão salva localmente:', e.message)
      }
    }
    return nova
  }

  async function editarMissao(dados) {
    const index = missoes.value.findIndex((m) => m.id === dados.id)
    if (index === -1) return

    const campos = {
      nome: dados.nome.trim(),
      descricao: (dados.descricao || '').trim(),
      xpMeta: Number(dados.xpMeta) || 100,
      xpPorTarefa: Number(dados.xpPorTarefa) || 25,
    }

    // Sempre atualiza localmente primeiro
    missoes.value[index] = { ...missoes.value[index], ...campos }

    // Tenta sincronizar com Supabase
    if (supabase) {
      try {
        await atualizarNoSupabase('missoes', dados.id, mapMissaoParaDb(campos))
      } catch (e) {
        console.warn('[Offline] Edição salva localmente:', e.message)
      }
    }
  }

  async function excluirMissao(id) {
    // Sempre exclui localmente primeiro
    missoes.value = missoes.value.filter((m) => m.id !== id)
    tarefas.value.forEach((t) => {
      if (t.missaoId === id) {
        t.missaoId = ''
      }
    })

    // Tenta sincronizar com Supabase
    if (supabase) {
      try {
        await supabase
          .from('tarefas')
          .update({ missao_id: null })
          .eq('missao_id', id)
        await excluirNoSupabase('missoes', id)
      } catch (e) {
        console.warn('[Offline] Exclusão salva localmente:', e.message)
      }
    }
  }

  function getMissaoPorId(id) {
    return missoes.value.find((m) => m.id === id) || null
  }

  // Progresso de XP da Missão
  function getProgressoMissao(missaoId) {
    const missao = getMissaoPorId(missaoId)
    if (!missao) {
      return { xpAtual: 0, xpMeta: 100, percentual: 0, totalTarefas: 0, concluidas: 0 }
    }

    const tarefasVinculadas = tarefas.value.filter((t) => t.missaoId === missaoId)
    const concluidas = tarefasVinculadas.filter((t) => t.concluida).length
    const xpPorTarefa = Number(missao.xpPorTarefa) || 25
    const xpAtual = concluidas * xpPorTarefa
    const xpMeta = Number(missao.xpMeta) || 100
    const percentual = Math.min(100, Math.round((xpAtual / xpMeta) * 100))

    return {
      xpAtual,
      xpMeta,
      percentual,
      totalTarefas: tarefasVinculadas.length,
      concluidas,
      concluida: xpAtual >= xpMeta,
    }
  }

  // --- CRUD Tarefas ---
  async function criarTarefa(dados) {
    const nova = {
      id: `quest_${Date.now()}`,
      nomeTarefa: dados.nomeTarefa.trim(),
      descricaoTarefas: (dados.descricaoTarefas || '').trim(),
      dataTarefa: dados.dataTarefa || new Date().toISOString().split('T')[0],
      missaoId: dados.missaoId || '',
      concluida: false,
      criadoEm: new Date().toISOString(),
    }

    // Sempre salva localmente primeiro
    tarefas.value.unshift(nova)

    // Tenta sincronizar com Supabase
    if (supabase) {
      try {
        const dbData = await inserirNoSupabase('tarefas', mapTarefaParaDb(nova))
        const index = tarefas.value.findIndex((t) => t.id === nova.id)
        if (index !== -1) {
          tarefas.value[index] = mapTarefaDoDb(dbData)
        }
      } catch (e) {
        console.warn('[Offline] Tarefa salva localmente:', e.message)
      }
    }
    return nova
  }

  async function editarTarefa(dados) {
    const index = tarefas.value.findIndex((t) => t.id === dados.id)
    if (index === -1) return

    const campos = {
      nomeTarefa: dados.nomeTarefa.trim(),
      descricaoTarefas: (dados.descricaoTarefas || '').trim(),
      dataTarefa: dados.dataTarefa,
      missaoId: dados.missaoId || '',
    }

    // Sempre atualiza localmente primeiro
    tarefas.value[index] = { ...tarefas.value[index], ...campos }

    // Tenta sincronizar com Supabase
    if (supabase) {
      try {
        await atualizarNoSupabase('tarefas', dados.id, mapTarefaParaDb(campos))
      } catch (e) {
        console.warn('[Offline] Edição salva localmente:', e.message)
      }
    }
  }

  async function excluirTarefa(id) {
    // Sempre exclui localmente primeiro
    tarefas.value = tarefas.value.filter((t) => t.id !== id)

    // Tenta sincronizar com Supabase
    if (supabase) {
      try {
        await excluirNoSupabase('tarefas', id)
      } catch (e) {
        console.warn('[Offline] Exclusão salva localmente:', e.message)
      }
    }
  }

  async function toggleConcluida(tarefa) {
    // Sempre atualiza localmente primeiro
    tarefa.concluida = !tarefa.concluida

    // Tenta sincronizar com Supabase
    if (supabase) {
      try {
        await atualizarNoSupabase('tarefas', tarefa.id, { concluida: tarefa.concluida })
      } catch (e) {
        console.warn('[Offline] Status salvo localmente:', e.message)
        // Não reverte mais — o dado local é a fonte de verdade quando offline
      }
    }
  }

  return {
    tarefas,
    missoes,
    carregando,
    erro,
    criarMissao,
    editarMissao,
    excluirMissao,
    getMissaoPorId,
    getProgressoMissao,
    criarTarefa,
    editarTarefa,
    excluirTarefa,
    toggleConcluida,
  }
}
