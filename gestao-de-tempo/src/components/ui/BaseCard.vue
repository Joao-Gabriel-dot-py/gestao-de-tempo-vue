<script setup>
defineProps({
  hover: {
    type: Boolean,
    default: true,
  },
  bordered: {
    type: Boolean,
    default: true,
  },
  padding: {
    type: String,
    default: 'p-5',
  },
  transparente: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <article
    class="card transition-all duration-200"
    :class="[
      transparente ? 'bg-base-200/40' : 'bg-base-100',
      bordered ? 'border border-base-300' : '',
      hover ? 'hover:shadow-md' : '',
      'shadow-sm'
    ]"
  >
    <div class="card-body" :class="padding">
      <header v-if="$slots.header" class="border-b border-base-200 pb-3 mb-2">
        <slot name="header"></slot>
      </header>

      <slot></slot>

      <footer v-if="$slots.footer" class="card-actions justify-end pt-2 border-t border-base-200 mt-2">
        <slot name="footer"></slot>
      </footer>
    </div>
  </article>
</template>
