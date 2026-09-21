<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const paginas = [
  { label: 'Início', nomeRota: 'home' },
  { label: 'Gestão de Tempo', nomeRota: 'gestao-de-tempo' },
  { label: 'Tarefas', nomeRota: 'tarefas' },
  { label: 'Missões', nomeRota: 'missoes' },
  { label: '⚙️', nomeRota: 'configuracoes' },
]

const router = useRouter()
const route = useRoute()

const tituloPagina = computed(() => route.meta?.titulo || '')

function navegarRotas(nomeRota) {
  router.push({ name: nomeRota })
}


</script>

<template>
  <nav class="navbar relative z-50 bg-base-100/90 backdrop-blur-sm shadow-sm border-b border-base-200 px-2 md:px-8">
    <div class="flex-1 flex items-center gap-2">
      <!-- Título da Página -->
      <h1 class="text-base md:text-lg font-bold tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-none">
        <span v-if="route.name === 'home'">⏱️ </span>{{ tituloPagina }}
      </h1>
    </div>

    <div class="flex-none">
      <!-- Menu Mobile (Dropdown) -->
      <div class="dropdown dropdown-end md:hidden">
        <label tabindex="0" class="btn btn-ghost btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </label>
        <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow bg-base-100 rounded-box w-52">
          <li v-for="pagina in paginas" :key="pagina.nomeRota">
            <button
              type="button"
              @click="navegarRotas(pagina.nomeRota)"
              class="font-medium transition-colors"
              :class="{ 'active font-bold': route.name === pagina.nomeRota }"
            >
              {{ pagina.label }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Menu Desktop (Horizontal) -->
      <ul class="menu menu-horizontal px-1 gap-1 hidden md:flex">
        <li v-for="pagina in paginas" :key="pagina.nomeRota">
          <button
            type="button"
            @click="navegarRotas(pagina.nomeRota)"
            class="font-medium transition-colors"
            :class="{ 'active font-bold': route.name === pagina.nomeRota }"
          >
            {{ pagina.label }}
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>