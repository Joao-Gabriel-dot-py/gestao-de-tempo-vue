<script setup>
import { ref, computed } from 'vue'
import { useGamificacao } from '@/composables/useGamificacao'
import FormularioTarefaComponent from './FormularioTarefaComponent.vue'
import {
  BaseCard,
  BaseButton,
  BaseBadge,
  BaseEmptyState,
  BaseInputBusca,
} from './ui'

const {
  tarefas,
  criarTarefa,
  editarTarefa,
  excluirTarefa,
  toggleConcluida,
  getMissaoPorId,
} = useGamificacao()

// Controle do modal de formulário
const modalAberto = ref(false)
const tarefaEmEdicao = ref(null)

// Estados de filtro e busca
const filtroAtual = ref('todas') // 'todas' | 'pendentes' | 'concluidas'
const termoBusca = ref('')

// Abrir formulário para nova tarefa
function abrirModalCriacao() {
  tarefaEmEdicao.value = null
  modalAberto.value = true
}

// Abrir formulário para editar tarefa existente
function abrirModalEdicao(tarefa) {
  tarefaEmEdicao.value = { ...tarefa }
  modalAberto.value = true
}

// Fechar formulário
function fecharModal() {
  modalAberto.value = false
  tarefaEmEdicao.value = null
}

// Salvar tarefa vinda do FormularioTarefaComponent (Create ou Update)
function onSalvarTarefa(dados) {
  if (dados.id) {
    editarTarefa(dados)
  } else {
    criarTarefa(dados)
  }
  fecharModal()
}

// Formatação amigável de data
function formatarData(dataStr) {
  if (!dataStr) return 'Sem data'
  const partes = dataStr.split('-')
  if (partes.length === 3) {
    const dataObj = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
    return dataObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  return dataStr
}

// Checar status do prazo
function getStatusPrazo(tarefa) {
  if (tarefa.concluida) return { tipo: 'concluida', texto: 'Concluída' }

  if (!tarefa.dataTarefa) return { tipo: 'sem-data', texto: 'Sem prazo' }

  const hoje = new Date().toISOString().split('T')[0]
  if (tarefa.dataTarefa < hoje) {
    return { tipo: 'atrasada', texto: 'Atrasada' }
  } else if (tarefa.dataTarefa === hoje) {
    return { tipo: 'hoje', texto: 'Para Hoje' }
  } else {
    return { tipo: 'futura', texto: 'Em dia' }
  }
}

// Lista filtrada e pesquisada
const tarefasFiltradas = computed(() => {
  return tarefas.value.filter((tarefa) => {
    // Filtro por status
    if (filtroAtual.value === 'pendentes' && tarefa.concluida) return false
    if (filtroAtual.value === 'concluidas' && !tarefa.concluida) return false

    // Filtro por termo de busca
    if (termoBusca.value.trim()) {
      const termo = termoBusca.value.toLowerCase()
      const nome = (tarefa.nomeTarefa || '').toLowerCase()
      const desc = (tarefa.descricaoTarefas || '').toLowerCase()
      const nomeMissao = tarefa.missaoId ? (getMissaoPorId(tarefa.missaoId)?.nome || '').toLowerCase() : ''
      return nome.includes(termo) || desc.includes(termo) || nomeMissao.includes(termo)
    }

    return true
  })
})

// Estatísticas para os badges
const totalTarefas = computed(() => tarefas.value.length)
const concluidasCount = computed(() => tarefas.value.filter((t) => t.concluida).length)
const pendentesCount = computed(() => totalTarefas.value - concluidasCount.value)
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Barra de Controle do Feed: Menu de Status + Busca + Botão para abrir o Formulário -->
    <BaseCard :hover="false" padding="p-4">
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- Menu de Status das Tarefas -->
        <div class="join bg-base-200/60 p-0.5 rounded-lg border border-base-300 self-start sm:self-auto">
          <BaseButton
            variante="ghost"
            tamanho="sm"
            class="join-item border-none"
            :class="{ 'btn-active btn-primary shadow-xs': filtroAtual === 'todas' }"
            @click="filtroAtual = 'todas'"
          >
            Todas ({{ totalTarefas }})
          </BaseButton>
          <BaseButton
            variante="ghost"
            tamanho="sm"
            class="join-item border-none"
            :class="{ 'btn-active btn-primary shadow-xs': filtroAtual === 'pendentes' }"
            @click="filtroAtual = 'pendentes'"
          >
            Pendentes ({{ pendentesCount }})
          </BaseButton>
          <BaseButton
            variante="ghost"
            tamanho="sm"
            class="join-item border-none"
            :class="{ 'btn-active btn-primary shadow-xs': filtroAtual === 'concluidas' }"
            @click="filtroAtual = 'concluidas'"
          >
            Concluídas ({{ concluidasCount }})
          </BaseButton>
        </div>

        <!-- Grupo da Direita: Busca + Botão para Abrir Formulário -->
        <div class="flex items-center gap-2 flex-1 md:justify-end">
          <div class="max-w-xs flex-1">
            <BaseInputBusca
              v-model="termoBusca"
              placeholder="Buscar quest..."
            />
          </div>

          <!-- BOTÃO PARA ABRIR O FORMULÁRIO -->
          <BaseButton
            variante="primary"
            icone="➕"
            class="shrink-0"
            @click="abrirModalCriacao"
          >
            Nova Tarefa
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- FEED DE TAREFAS (Coluna Única / Containers em Feed) -->
    <section class="flex flex-col gap-4">
      <!-- Estado Vazio -->
      <BaseEmptyState
        v-if="tarefasFiltradas.length === 0"
        icone="📜"
        titulo="Nenhuma tarefa encontrada"
        :descricao="
          termoBusca
            ? 'Nenhum resultado corresponde à sua pesquisa.'
            : 'Não há tarefas nesta categoria. Clique em \'Nova Tarefa\' para adicionar ao feed!'
        "
      >
        <template #action>
          <BaseButton
            variante="outline-primary"
            icone="➕"
            @click="abrirModalCriacao"
          >
            Criar Primeira Tarefa
          </BaseButton>
        </template>
      </BaseEmptyState>

      <!-- Lista de Containers do Feed usando BaseCard -->
      <BaseCard
        v-for="tarefa in tarefasFiltradas"
        :key="tarefa.id"
        :transparente="tarefa.concluida"
        :hover="true"
        padding="p-5"
        class="space-y-3"
      >
        <!-- Cabeçalho do Card da Tarefa -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <!-- Checkbox de conclusão -->
            <input
              type="checkbox"
              :checked="tarefa.concluida"
              @change="toggleConcluida(tarefa)"
              class="checkbox checkbox-primary checkbox-sm mt-1"
              title="Marcar como concluída (ganha XP se vinculada à missão)"
            />

            <div class="flex-1 min-w-0">
              <h3
                class="font-bold text-base md:text-lg text-base-content break-words"
                :class="{ 'line-through text-base-content/50': tarefa.concluida }"
              >
                {{ tarefa.nomeTarefa }}
              </h3>

              <!-- Data, Missão e Badges usando BaseBadge -->
              <div class="flex flex-wrap items-center gap-2 mt-1">
                <!-- Data -->
                <span class="inline-flex items-center gap-1 text-xs text-base-content/70">
                  <span>📅</span>
                  {{ formatarData(tarefa.dataTarefa) }}
                </span>

                <!-- Badge de Missão Vinculada (Opcional) -->
                <BaseBadge
                  v-if="tarefa.missaoId && getMissaoPorId(tarefa.missaoId)"
                  variante="primary"
                  :outline="true"
                  icone="🎯"
                  :titulo="`Vinculada à missão: ${getMissaoPorId(tarefa.missaoId)?.nome}`"
                >
                  {{ getMissaoPorId(tarefa.missaoId)?.nome }}
                  <span class="text-primary font-bold">(+{{ getMissaoPorId(tarefa.missaoId)?.xpPorTarefa || 25 }} XP)</span>
                </BaseBadge>

                <!-- Badges de Prazo/Status -->
                <BaseBadge
                  v-if="getStatusPrazo(tarefa).tipo === 'atrasada'"
                  variante="error"
                >
                  Atrasada
                </BaseBadge>
                <BaseBadge
                  v-else-if="getStatusPrazo(tarefa).tipo === 'hoje'"
                  variante="warning"
                >
                  Hoje
                </BaseBadge>
                <BaseBadge
                  v-else-if="getStatusPrazo(tarefa).tipo === 'concluida'"
                  variante="success"
                >
                  ✓ Feita
                </BaseBadge>
              </div>
            </div>
          </div>

          <!-- Botões de Ação usando BaseButton -->
          <div class="flex items-center gap-1 shrink-0">
            <BaseButton
              variante="ghost"
              tamanho="xs"
              :quadrado="true"
              icone="✏️"
              titulo="Editar Tarefa"
              @click="abrirModalEdicao(tarefa)"
            />
            <BaseButton
              variante="error"
              tamanho="xs"
              :quadrado="true"
              icone="🗑️"
              titulo="Excluir Tarefa"
              @click="excluirTarefa(tarefa.id)"
            />
          </div>
        </div>

        <!-- Descrição da Tarefa (se houver) -->
        <div
          v-if="tarefa.descricaoTarefas"
          class="text-sm text-base-content/80 whitespace-pre-line bg-base-200/40 p-3 rounded-lg border border-base-200 mt-2"
          :class="{ 'text-base-content/50': tarefa.concluida }"
        >
          {{ tarefa.descricaoTarefas }}
        </div>
      </BaseCard>
    </section>

    <!-- Componente do Formulário (Modal Reutilizável de Criação e Edição) -->
    <FormularioTarefaComponent
      :aberto="modalAberto"
      :tarefa-em-edicao="tarefaEmEdicao"
      @salvar="onSalvarTarefa"
      @fechar="fecharModal"
    />
  </div>
</template>
