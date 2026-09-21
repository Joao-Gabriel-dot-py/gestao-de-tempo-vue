<script setup>
import { ref, computed } from 'vue'
import { useGamificacao } from '@/composables/useGamificacao'
import FormularioMissaoComponent from './FormularioMissaoComponent.vue'
import {
  BaseCard,
  BaseButton,
  BaseBadge,
  BaseEmptyState,
  BaseInputBusca,
} from './ui'

const {
  missoes,
  criarMissao,
  editarMissao,
  excluirMissao,
  getProgressoMissao,
} = useGamificacao()

// Controle do modal do formulário
const modalAberto = ref(false)
const missaoEmEdicao = ref(null)

// Filtro/busca
const termoBusca = ref('')

function abrirCriacao() {
  missaoEmEdicao.value = null
  modalAberto.value = true
}

function abrirEdicao(missao) {
  missaoEmEdicao.value = { ...missao }
  modalAberto.value = true
}

function fecharModal() {
  modalAberto.value = false
  missaoEmEdicao.value = null
}

function onSalvarMissao(dados) {
  if (dados.id) {
    editarMissao(dados)
  } else {
    criarMissao(dados)
  }
  fecharModal()
}

// Missões filtradas pela busca
const missoesFiltradas = computed(() => {
  if (!termoBusca.value.trim()) return missoes.value
  const termo = termoBusca.value.toLowerCase()
  return missoes.value.filter(
    (m) =>
      m.nome.toLowerCase().includes(termo) ||
      (m.descricao && m.descricao.toLowerCase().includes(termo))
  )
})

// Estatísticas globais
const totalMissoes = computed(() => missoes.value.length)
const totalXpGerado = computed(() => {
  return missoes.value.reduce((acc, m) => {
    return acc + getProgressoMissao(m.id).xpAtual
  }, 0)
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Barra de Controle & Gamificação -->
    <BaseCard :hover="false" padding="p-4 md:p-5">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <!-- Resumo de Gamificação -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl border border-primary/20 select-none">
            🏆
          </div>
          <div>
            <h2 class="text-base font-bold text-base-content">Painel de Missões & Fases</h2>
            <div class="flex items-center gap-3 text-xs text-base-content/70 mt-0.5">
              <span><strong>{{ totalMissoes }}</strong> missões ativas</span>
              <span>•</span>
              <span class="text-primary font-semibold">⚡ {{ totalXpGerado }} XP acumulado</span>
            </div>
          </div>
        </div>

        <!-- Grupo Direita: Busca + Botão Criar -->
        <div class="flex items-center gap-2">
          <div class="max-w-xs sm:w-56">
            <BaseInputBusca
              v-model="termoBusca"
              placeholder="Buscar missão..."
            />
          </div>

          <BaseButton
            variante="primary"
            icone="➕"
            class="shrink-0"
            @click="abrirCriacao"
          >
            Nova Missão
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Lista de Missões (Containers / Feed de Fases) -->
    <section class="space-y-4">
      <!-- Estado Vazio -->
      <BaseEmptyState
        v-if="missoesFiltradas.length === 0"
        icone="🎯"
        titulo="Nenhuma missão encontrada"
        :descricao="
          termoBusca
            ? 'Nenhuma missão corresponde ao termo digitado.'
            : 'As missões dão propósito às suas tarefas diárias. Crie seu primeiro objetivo para começar a acumular XP!'
        "
      >
        <template #action>
          <BaseButton
            variante="primary"
            icone="➕"
            @click="abrirCriacao"
          >
            Criar Primeira Missão
          </BaseButton>
        </template>
      </BaseEmptyState>

      <!-- Cards das Missões usando BaseCard -->
      <BaseCard
        v-for="missao in missoesFiltradas"
        :key="missao.id"
        :hover="true"
        padding="p-5 md:p-6"
        class="space-y-4"
      >
        <!-- Topo do Card -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <span class="text-3xl shrink-0 mt-0.5 select-none">🎯</span>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-bold text-lg text-base-content break-words">
                  {{ missao.nome }}
                </h3>
                <!-- Badge Sem Prazo -->
                <BaseBadge variante="ghost" icone="⏳">
                  Sem prazo fixo
                </BaseBadge>
                <!-- Badge Concluída se XP >= Meta -->
                <BaseBadge
                  v-if="getProgressoMissao(missao.id).concluida"
                  variante="success"
                  icone="🎉"
                >
                  Nível Concluído
                </BaseBadge>
              </div>

              <p
                v-if="missao.descricao"
                class="text-sm text-base-content/70 mt-1 whitespace-pre-line"
              >
                {{ missao.descricao }}
              </p>
            </div>
          </div>

          <!-- Ações usando BaseButton -->
          <div class="flex items-center gap-1 shrink-0">
            <BaseButton
              variante="ghost"
              tamanho="xs"
              :quadrado="true"
              icone="✏️"
              titulo="Editar Missão"
              @click="abrirEdicao(missao)"
            />
            <BaseButton
              variante="error"
              tamanho="xs"
              :quadrado="true"
              icone="🗑️"
              titulo="Excluir Missão"
              @click="excluirMissao(missao.id)"
            />
          </div>
        </div>

        <!-- BARRA DE CARREGAMENTO DE XP DA MISSÃO -->
        <div class="bg-base-200/50 p-3.5 rounded-xl border border-base-200 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5 font-semibold text-base-content">
              <span>⚡ Barra de XP:</span>
              <span class="text-primary font-bold">
                {{ getProgressoMissao(missao.id).xpAtual }} / {{ getProgressoMissao(missao.id).xpMeta }} XP
              </span>
            </div>
            <span class="font-bold text-primary">
              {{ getProgressoMissao(missao.id).percentual }}%
            </span>
          </div>

          <!-- Progresso animado -->
          <progress
            class="progress progress-primary w-full h-3"
            :value="getProgressoMissao(missao.id).xpAtual"
            :max="getProgressoMissao(missao.id).xpMeta"
          ></progress>

          <!-- Rodapé da barra de XP com tarefas vinculadas -->
          <div class="flex flex-wrap items-center justify-between text-[11px] text-base-content/60 pt-0.5">
            <span>
              📋 Tarefas vinculadas:
              <strong>{{ getProgressoMissao(missao.id).concluidas }}</strong> de
              <strong>{{ getProgressoMissao(missao.id).totalTarefas }}</strong> concluídas
            </span>
            <span>+{{ missao.xpPorTarefa || 25 }} XP por tarefa realizada</span>
          </div>
        </div>
      </BaseCard>
    </section>

    <!-- Modal de Criação / Edição de Missão -->
    <FormularioMissaoComponent
      :aberto="modalAberto"
      :missao-em-edicao="missaoEmEdicao"
      @salvar="onSalvarMissao"
      @fechar="fecharModal"
    />
  </div>
</template>
