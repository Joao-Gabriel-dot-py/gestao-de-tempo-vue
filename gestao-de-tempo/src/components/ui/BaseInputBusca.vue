<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Buscar...',
  },
  tamanho: {
    type: String,
    default: 'input-sm',
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="relative flex-1">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="text"
      :placeholder="placeholder"
      class="input input-bordered w-full pl-8 focus:input-primary"
      :class="tamanho"
    />
    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/50 text-xs select-none">
      🔍
    </span>
    <button
      v-if="modelValue"
      type="button"
      @click="$emit('update:modelValue', '')"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
      aria-label="Limpar busca"
    >
      ✕
    </button>
  </div>
</template>
