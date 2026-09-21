<script setup>
defineProps({
  aberto: {
    type: Boolean,
    default: false,
  },
  titulo: {
    type: String,
    default: '',
  },
  subtitulo: {
    type: String,
    default: '',
  },
  icone: {
    type: String,
    default: '',
  },
  tamanho: {
    type: String,
    default: 'max-w-lg',
  },
})

const emit = defineEmits(['fechar'])
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': aberto }">
    <div class="modal-box border border-base-300 shadow-2xl" :class="tamanho">
      <!-- Cabeçalho -->
      <header v-if="$slots.header || titulo" class="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
        <slot name="header">
          <div class="flex items-center gap-2">
            <span v-if="icone" class="text-2xl select-none">{{ icone }}</span>
            <div>
              <h3 class="font-bold text-lg text-base-content">{{ titulo }}</h3>
              <p v-if="subtitulo" class="text-xs text-base-content/60">{{ subtitulo }}</p>
            </div>
          </div>
        </slot>

        <button
          type="button"
          @click="emit('fechar')"
          class="btn btn-sm btn-circle btn-ghost"
          aria-label="Fechar"
        >
          ✕
        </button>
      </header>

      <!-- Conteúdo Principal -->
      <main>
        <slot></slot>
      </main>

      <!-- Rodapé / Ações -->
      <footer v-if="$slots.actions" class="modal-action border-t border-base-200 pt-3">
        <slot name="actions"></slot>
      </footer>
    </div>

    <!-- Backdrop com fechamento ao clicar fora -->
    <form method="dialog" class="modal-backdrop" @submit.prevent="emit('fechar')">
      <button>Fechar</button>
    </form>
  </dialog>
</template>
