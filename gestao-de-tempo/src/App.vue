<script setup>
import DefautlLayout from './layouts/DefautlLayout.vue';
import { useNotificacoes } from './composables/useNotificacoes';

useNotificacoes()

</script>

<template>
  <DefautlLayout />
</template>

<style scoped></style>
