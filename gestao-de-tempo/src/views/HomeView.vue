<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const deferredPrompt = ref(null)

function handleInstallPrompt(e) {
  e.preventDefault()
  deferredPrompt.value = e
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
})

async function installApp() {
  if (!deferredPrompt.value) {
    alert("Seu navegador não suporta a instalação automática por aqui, ou o app já está instalado!\n\nNo celular: Procure por 'Adicionar à Tela Inicial' no menu do navegador.\nNo PC: Procure pelo ícone de instalação na barra de endereços (lado direito).")
    return
  }
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    deferredPrompt.value = null
  }
}
</script>

<template>
  <div class="p-6 md:p-12 max-w-4xl mx-auto flex flex-col items-center text-center mt-10 md:mt-20">
    <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
      Bem-vindo ao <span class="text-sky-300">Gestão de Tempo</span>
    </h1>
    <p class="text-lg text-white/90 mb-8 max-w-2xl font-medium drop-shadow-sm">
      Organize sua rotina, gerencie suas tarefas diárias e ganhe pontos completando missões. Tudo em um só lugar.
    </p>

    <!-- Card de Instalação (PWA) -->
    <div class="card bg-base-100 shadow-xl border border-base-200 p-6 md:p-8 max-w-md w-full hover:shadow-2xl transition-shadow">
      <div class="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
      <h2 class="text-xl font-bold mb-2">Instale o Aplicativo</h2>
      <p class="text-sm text-base-content/70 mb-6">
        Tenha acesso rápido direto da sua tela inicial, use em tela cheia e desfrute da melhor experiência.
      </p>
      <button @click="installApp" class="btn btn-primary w-full shadow-lg shadow-primary/30">
        Instalar Agora
      </button>
    </div>
  </div>
</template>
