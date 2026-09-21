<script setup>
import { ref, watch, computed } from 'vue'
import { useGamificacao } from '@/composables/useGamificacao'
import BaseModal from './ui/BaseModal.vue'
import BaseButton from './ui/BaseButton.vue'

const { missoes } = useGamificacao()

const props = defineProps({
  aberto: {
    type: Boolean,
    default: false,
  },
  tarefaEmEdicao: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['salvar', 'fechar'])

const form = ref({
  nomeTarefa: '',
  descricaoTarefas: '',
  dataTarefa: '',
  missaoId: '',
})

const isModoEdicao = computed(() => !!props.tarefaEmEdicao)

watch(
  () => [props.aberto, props.tarefaEmEdicao],
  ([aberto, tarefa]) => {
    if (aberto) {
      if (tarefa) {
        form.value = {
          nomeTarefa: tarefa.nomeTarefa || '',
          descricaoTarefas: tarefa.descricaoTarefas || '',
          dataTarefa: tarefa.dataTarefa || '',
          missaoId: tarefa.missaoId || '',
        }
      } else {
        form.value = {
          nomeTarefa: '',
          descricaoTarefas: '',
          dataTarefa: new Date().toISOString().split('T')[0],
          missaoId: '',
        }
      }
    }
  },
  { immediate: true }
)

function onSubmit() {
  if (!form.value.nomeTarefa.trim()) return

  emit('salvar', {
    ...form.value,
    nomeTarefa: form.value.nomeTarefa.trim(),
    descricaoTarefas: form.value.descricaoTarefas.trim(),
    missaoId: form.value.missaoId,
    id: props.tarefaEmEdicao?.id,
  })
}
</script>

<template>
  <BaseModal
    :aberto="aberto"
    :titulo="isModoEdicao ? 'Editar Quest / Tarefa' : 'Criar Nova Quest / Tarefa'"
    :subtitulo="isModoEdicao ? 'Altere os dados da tarefa selecionada' : 'Preencha os dados para adicionar ao seu feed'"
    :icone="isModoEdicao ? '✏️' : '⚔️'"
    @fechar="$emit('fechar')"
  >
    <form @submit.prevent="onSubmit" class="space-y-4">
      <!-- Campo: nomeTarefa -->
      <div class="form-control">
        <label class="label pb-1">
          <span class="label-text font-semibold text-sm">Nome da Tarefa *</span>
        </label>
        <input
          v-model="form.nomeTarefa"
          type="text"
          placeholder="Ex: Desenvolver componente de tarefas..."
          class="input input-bordered w-full focus:input-primary"
          required
          autofocus
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Campo: dataTarefa -->
        <div class="form-control">
          <label class="label pb-1">
            <span class="label-text font-semibold text-sm">Data da Tarefa</span>
          </label>
          <input
            v-model="form.dataTarefa"
            type="date"
            class="input input-bordered w-full focus:input-primary"
          />
        </div>

        <!-- Campo: missaoId (Opcional) -->
        <div class="form-control">
          <label class="label pb-1">
            <span class="label-text font-semibold text-sm">Missão / Objetivo</span>
            <span class="label-text-alt text-xs text-base-content/60">Opcional</span>
          </label>
          <select
            v-model="form.missaoId"
            class="select select-bordered w-full focus:select-primary"
          >
            <option value="">Sem missão vinculada</option>
            <option v-for="m in missoes" :key="m.id" :value="m.id">
              🎯 {{ m.nome }} (+{{ m.xpPorTarefa || 25 }} XP)
            </option>
          </select>
        </div>
      </div>

      <!-- Campo: descricaoTarefas -->
      <div class="form-control">
        <label class="label pb-1">
          <span class="label-text font-semibold text-sm">Descrição da Tarefa</span>
        </label>
        <textarea
          v-model="form.descricaoTarefas"
          rows="4"
          placeholder="Descreva detalhes, objetivos ou anotações da quest..."
          class="textarea textarea-bordered w-full focus:textarea-primary"
        ></textarea>
      </div>

      <!-- Ações do Formulário -->
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
          :icone="isModoEdicao ? '💾' : '➕'"
          :disabled="!form.nomeTarefa.trim()"
        >
          {{ isModoEdicao ? 'Salvar Alterações' : 'Adicionar ao Feed' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
