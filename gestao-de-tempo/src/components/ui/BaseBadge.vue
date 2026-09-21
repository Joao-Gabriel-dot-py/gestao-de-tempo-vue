<script setup>
defineProps({
  variante: {
    type: String,
    default: 'ghost', // 'success', 'warning', 'error', 'primary', 'info', 'ghost', 'neutral'
  },
  outline: {
    type: Boolean,
    default: false,
  },
  tamanho: {
    type: String,
    default: 'xs', // 'xs', 'sm', 'md'
  },
  icone: {
    type: String,
    default: '',
  },
  titulo: {
    type: String,
    default: '',
  },
})

const mapaVariantes = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  primary: 'badge-primary',
  info: 'badge-info',
  ghost: 'badge-ghost text-base-content/70',
  neutral: 'badge-neutral',
}

const mapaTamanhos = {
  xs: 'badge-xs py-2 px-2 text-[11px]',
  sm: 'badge-sm',
  md: 'badge-md',
}
</script>

<template>
  <span
    class="badge gap-1 font-medium inline-flex items-center select-none"
    :class="[
      mapaVariantes[variante] || 'badge-ghost',
      mapaTamanhos[tamanho] || 'badge-xs',
      outline ? 'badge-outline' : '',
    ]"
    :title="titulo"
  >
    <span v-if="icone">{{ icone }}</span>
    <slot></slot>
  </span>
</template>
