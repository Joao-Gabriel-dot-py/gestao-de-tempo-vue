<script setup>
defineProps({
  icone: {
    type: String,
    default: '📜',
  },
  titulo: {
    type: String,
    default: 'Nenhum item encontrado',
  },
  descricao: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="card bg-base-100 border border-dashed border-base-300 text-center p-8 md:p-10 space-y-3">
    <div class="text-4xl select-none">{{ icone }}</div>
    <h3 class="text-base font-bold text-base-content">{{ titulo }}</h3>
    <p v-if="descricao" class="text-sm text-base-content/60 max-w-md mx-auto">
      {{ descricao }}
    </p>
    <div v-if="$slots.action" class="pt-2">
      <slot name="action"></slot>
    </div>
  </div>
</template>
