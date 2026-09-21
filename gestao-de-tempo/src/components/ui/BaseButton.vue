<script setup>
defineProps({
  variante: {
    type: String,
    default: 'primary', // 'primary', 'secondary', 'ghost', 'error', 'error-solid', 'outline', 'outline-primary'
  },
  tamanho: {
    type: String,
    default: 'sm', // 'xs', 'sm', 'md', 'lg'
  },
  quadrado: {
    type: Boolean,
    default: false,
  },
  icone: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  tipo: {
    type: String,
    default: 'button',
  },
  titulo: {
    type: String,
    default: '',
  },
})

defineEmits(['click'])

const mapaVariantes = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  error: 'btn-ghost text-error hover:bg-error/10',
  'error-solid': 'btn-error',
  outline: 'btn-outline',
  'outline-primary': 'btn-outline btn-primary',
}

const mapaTamanhos = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}
</script>

<template>
  <button
    :type="tipo"
    :disabled="disabled"
    :title="titulo"
    class="btn gap-1.5 transition-all"
    :class="[
      mapaVariantes[variante] || 'btn-primary',
      mapaTamanhos[tamanho] || 'btn-sm',
      quadrado ? 'btn-square' : '',
    ]"
    @click="$emit('click', $event)"
  >
    <span v-if="icone" class="leading-none select-none">{{ icone }}</span>
    <slot></slot>
  </button>
</template>
