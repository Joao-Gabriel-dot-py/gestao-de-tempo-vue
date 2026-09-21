<script setup>
import { ref, watch, computed } from 'vue'
import BaseModal from './ui/BaseModal.vue'
import BaseButton from './ui/BaseButton.vue'

const props = defineProps({
  aberto: {
    type: Boolean,
    default: false,
  },
  missaoEmEdicao: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['salvar', 'fechar'])

const form = ref({
  nome: '',
  descricao: '',
  xpMeta: 100,
  xpPorTarefa: 25,
})

const isModoEdicao = computed(() => !!props.missaoEmEdicao)

watch(
  () => [props.aberto, props.missaoEmEdicao],
  ([aberto, missao]) => {
    if (aberto) {
      if (missao) {
        form.value = {
          nome: missao.nome || '',
          descricao: missao.descricao || '',
          xpMeta: missao.xpMeta || 100,
          xpPorTarefa: missao.xpPorTarefa || 25,
        }
      } else {
        form.value = {
          nome: '',
          descricao: '',
          xpMeta: 100,
          xpPorTarefa: 25,
        }
      }
    }
  },
  { immediate: true }
)

function onSubmit() {
  if (!form.value.nome.trim()) return

  emit('salvar', {
    ...form.value,
    nome: form.value.nome.trim(),
    descricao: form.value.descricao.trim(),
    id: props.missaoEmEdicao?.id,
  })
}
</script>

<template>
  <BaseModal
    :aberto="aberto"
    :titulo="isModoEdicao ? 'Editar Missão / Objetivo' : 'Nova Missão / Objetivo'"
    :subtitulo="isModoEdicao ? 'Atualize as diretrizes da sua missão' : 'Crie uma fase/objetivo de longo prazo sem prazo fixo'"
    icone="🎯"
    @fechar="$emit('fechar')"
  >
    <form @submit.prevent="onSubmit" class="space-y-4">
      <!-- Nome da Missão -->
      <div class="form-control">
        <label class="label pb-1">
          <span class="label-text font-semibold text-sm">Nome da Missão *</span>
        </label>
        <input
          v-model="form.nome"
          type="text"
          placeholder="Ex: Mestre da Produtividade, Rotina Saudável..."
          class="input input-bordered w-full focus:input-primary"
          required
          autofocus
        />
      </div>

      <!-- Descrição da Missão -->
      <div class="form-control">
        <label class="label pb-1">
          <span class="label-text font-semibold text-sm">Descrição / Propósito</span>
        </label>
        <textarea
          v-model="form.descricao"
          rows="3"
          placeholder="Qual é a motivação ou objetivo maior dessa missão?"
          class="textarea textarea-bordered w-full focus:textarea-primary"
        ></textarea>
      </div>

      <!-- Metas de XP e Gamificação -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label pb-1">
            <span class="label-text font-semibold text-sm">Meta de XP (Barra)</span>
          </label>
          <input
            v-model.number="form.xpMeta"
            type="number"
            min="25"
            step="25"
            class="input input-bordered w-full focus:input-primary"
            required
          />
        </div>

        <div class="form-control">
          <label class="label pb-1">
            <span class="label-text font-semibold text-sm">XP por Tarefa Concluída</span>
          </label>
          <input
            v-model.number="form.xpPorTarefa"
            type="number"
            min="5"
            step="5"
            class="input input-bordered w-full focus:input-primary"
            required
          />
        </div>
      </div>

      <!-- Dica sobre a ausência de prazo -->
      <div class="alert alert-info py-2 px-3 text-xs bg-info/10 text-info-content border border-info/20">
        <span>⏳ <strong>Sem prazo fixo:</strong> Missões representam conquistas contínuas. Cada tarefa vinculada e finalizada preenche a barra de XP!</span>
      </div>

      <!-- Ações do Modal -->
      <div class="modal-action border-t border-base-200 pt-3">
        <BaseButton
          variante="ghost"
          @click="$emit('fechar')"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          tipo="submit"
          variante="primary"
          :icone="isModoEdicao ? '💾' : '🚀'"
          :disabled="!form.nome.trim()"
        >
          {{ isModoEdicao ? 'Salvar Missão' : 'Iniciar Missão' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
