<script setup>
import NavbarComponent from '@/components/NavbarComponent.vue';
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-blue-700 to-blue-900">
    <NavbarComponent />
    <main class="flex-1">
      <RouterView />
    </main>
    <footer></footer>
  </div>
</template>