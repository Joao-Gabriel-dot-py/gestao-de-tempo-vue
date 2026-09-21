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
// Inicialização
// ==========================================

async function inicializarDados() {
  if (inicializado) return
  inicializado = true
  carregando.value = true
  erro.value = null

  try {
    if (supabase) {
      // Carregar do Supabase
      missoes.value = (await carregarDoSupabase('missoes')).map(mapMissaoDoDb)
      tarefas.value = (await carregarDoSupabase('tarefas')).map(mapTarefaDoDb)
    } else {
      // Fallback: localStorage
      carregarDoLocalStorage()
      configurarWatchersLocalStorage()
    }
  } catch (e) {
    console.error('[Supabase] Erro ao carregar dados, usando localStorage:', e)
    erro.value = e.message
    carregarDoLocalStorage()
    configurarWatchersLocalStorage()
  } finally {
    carregando.value = false
  }
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
// localStorage (fallback)
// ==========================================

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

function configurarWatchersLocalStorage() {
  watch(
    missoes,
    (novas) => {
      localStorage.setItem(STORAGE_MISSOES, JSON.stringify(novas))
    },
    { deep: true }
  )

  watch(
    tarefas,
    (novas) => {
      localStorage.setItem(STORAGE_TAREFAS, JSON.stringify(novas))
    },
    { deep: true }
  )
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

    if (supabase) {
      try {
        const dbData = await inserirNoSupabase('missoes', mapMissaoParaDb(nova))
        const missaoDb = mapMissaoDoDb(dbData)
        missoes.value.unshift(missaoDb)
        return missaoDb
      } catch (e) {
        console.error('[Supabase] Erro ao criar missão:', e)
        erro.value = e.message
      }
    } else {
      missoes.value.unshift(nova)
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

    if (supabase) {
      try {
        await atualizarNoSupabase('missoes', dados.id, mapMissaoParaDb(campos))
      } catch (e) {
        console.error('[Supabase] Erro ao editar missão:', e)
        erro.value = e.message
      }
    }

    missoes.value[index] = { ...missoes.value[index], ...campos }
  }

  async function excluirMissao(id) {
    if (supabase) {
      try {
        // Desvincular tarefas no DB
        await supabase
          .from('tarefas')
          .update({ missao_id: null })
          .eq('missao_id', id)
        await excluirNoSupabase('missoes', id)
      } catch (e) {
        console.error('[Supabase] Erro ao excluir missão:', e)
        erro.value = e.message
      }
    }

    missoes.value = missoes.value.filter((m) => m.id !== id)
    // Desvincula as tarefas dessa missão localmente
    tarefas.value.forEach((t) => {
      if (t.missaoId === id) {
        t.missaoId = ''
      }
    })
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

    if (supabase) {
      try {
        const dbData = await inserirNoSupabase('tarefas', mapTarefaParaDb(nova))
        const tarefaDb = mapTarefaDoDb(dbData)
        tarefas.value.unshift(tarefaDb)
        return tarefaDb
      } catch (e) {
        console.error('[Supabase] Erro ao criar tarefa:', e)
        erro.value = e.message
      }
    } else {
      tarefas.value.unshift(nova)
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

    if (supabase) {
      try {
        await atualizarNoSupabase('tarefas', dados.id, mapTarefaParaDb(campos))
      } catch (e) {
        console.error('[Supabase] Erro ao editar tarefa:', e)
        erro.value = e.message
      }
    }

    tarefas.value[index] = { ...tarefas.value[index], ...campos }
  }

  async function excluirTarefa(id) {
    if (supabase) {
      try {
        await excluirNoSupabase('tarefas', id)
      } catch (e) {
        console.error('[Supabase] Erro ao excluir tarefa:', e)
        erro.value = e.message
      }
    }

    tarefas.value = tarefas.value.filter((t) => t.id !== id)
  }

  async function toggleConcluida(tarefa) {
    tarefa.concluida = !tarefa.concluida

    if (supabase) {
      try {
        await atualizarNoSupabase('tarefas', tarefa.id, { concluida: tarefa.concluida })
      } catch (e) {
        console.error('[Supabase] Erro ao atualizar status:', e)
        erro.value = e.message
        // Reverte em caso de erro
        tarefa.concluida = !tarefa.concluida
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
