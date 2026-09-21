<script setup>
import { ref } from 'vue'
import { useNotificacoes } from '@/composables/useNotificacoes'

const { horarioNotificacao, salvarHorario } = useNotificacoes()

const horarioLocal = ref(horarioNotificacao.value)
const salvo = ref(false)

function salvar() {
  salvarHorario(horarioLocal.value)
  salvo.value = true
  setTimeout(() => { salvo.value = false }, 2000)
}

const permissaoNotificacao = ref(
  'Notification' in window ? Notification.permission : 'unsupported'
)

async function pedirPermissao() {
  if (!('Notification' in window)) return
  const result = await Notification.requestPermission()
  permissaoNotificacao.value = result
}
</script>

<template>
  <div class="p-6 md:p-12 max-w-2xl mx-auto mt-6 md:mt-12">
    <h1 class="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">
      ⚙️ Configurações
    </h1>
    <p class="text-white/70 mb-8">Personalize o comportamento do app.</p>

    <!-- Card: Notificações -->
    <div class="card bg-base-100 shadow-xl border border-base-200 p-6 md:p-8 mb-6">
      <h2 class="text-xl font-bold mb-1 flex items-center gap-2">
        🔔 Notificações
      </h2>
      <p class="text-sm text-base-content/60 mb-6">
        Receba lembretes diários sobre tarefas com prazo próximo (até 3 dias).
      </p>

      <!-- Status da permissão -->
      <div class="mb-6">
        <label class="label">
          <span class="label-text font-semibold">Permissão do navegador</span>
        </label>
        <div class="flex items-center gap-3">
          <span
            class="badge badge-lg"
            :class="{
              'badge-success': permissaoNotificacao === 'granted',
              'badge-warning': permissaoNotificacao === 'default',
              'badge-error': permissaoNotificacao === 'denied',
              'badge-ghost': permissaoNotificacao === 'unsupported',
            }"
          >
            {{
              permissaoNotificacao === 'granted' ? '✅ Permitido' :
              permissaoNotificacao === 'default' ? '⏳ Não definido' :
              permissaoNotificacao === 'denied' ? '❌ Bloqueado' :
              '⚠️ Não suportado'
            }}
          </span>
          <button
            v-if="permissaoNotificacao === 'default'"
            @click="pedirPermissao"
            class="btn btn-sm btn-primary"
          >
            Permitir notificações
          </button>
          <span v-if="permissaoNotificacao === 'denied'" class="text-xs text-base-content/50">
            Desbloqueie nas configurações do navegador.
          </span>
        </div>
      </div>

      <!-- Horário -->
      <div class="mb-6">
        <label class="label" for="horario-notificacao">
          <span class="label-text font-semibold">Horário do lembrete diário</span>
        </label>
        <div class="flex items-center gap-3">
          <input
            id="horario-notificacao"
            type="time"
            v-model="horarioLocal"
            class="input input-bordered w-40"
          />
          <button
            @click="salvar"
            class="btn btn-primary btn-sm"
            :class="{ 'btn-success': salvo }"
          >
            {{ salvo ? '✅ Salvo!' : 'Salvar' }}
          </button>
        </div>
        <p class="text-xs text-base-content/50 mt-2">
          Todo dia neste horário, o app vai avisar sobre tarefas com prazo em até 3 dias.
        </p>
      </div>
    </div>
  </div>
</template>
