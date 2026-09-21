import { ref, onMounted, onUnmounted } from 'vue'
import { useGamificacao } from './useGamificacao'

const STORAGE_LAST_NOTIFIED = 'gestao-tempo-last-notified'
const STORAGE_HORA_NOTIF = 'gestao-tempo-hora-notificacao'
const DIAS_ANTES_PRAZO = 3

let intervalId = null
let ativo = false

/**
 * Lê o horário configurado do localStorage. Padrão: 14:30.
 */
function getHorarioConfigurado() {
  const salvo = localStorage.getItem(STORAGE_HORA_NOTIF)
  if (salvo) {
    const [h, m] = salvo.split(':').map(Number)
    if (!isNaN(h) && !isNaN(m)) return { hora: h, minuto: m }
  }
  return { hora: 14, minuto: 30 }
}

/**
 * Salva o horário no localStorage.
 */
function setHorarioConfigurado(horaStr) {
  localStorage.setItem(STORAGE_HORA_NOTIF, horaStr)
}

/**
 * Calcula quantos dias faltam para a data da tarefa.
 * Retorna negativo se já passou do prazo.
 */
function diasRestantes(dataTarefa) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const prazo = new Date(dataTarefa + 'T00:00:00')
  const diff = prazo.getTime() - hoje.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD.
 */
function hojeStr() {
  return new Date().toISOString().split('T')[0]
}

function jaNotificouHoje() {
  return localStorage.getItem(STORAGE_LAST_NOTIFIED) === hojeStr()
}

function marcarNotificado() {
  localStorage.setItem(STORAGE_LAST_NOTIFIED, hojeStr())
}

/**
 * Solicita permissão para enviar notificações.
 */
async function pedirPermissao() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * Envia uma notificação do navegador.
 */
function enviarNotificacao(titulo, corpo) {
  if (Notification.permission !== 'granted') return

  new Notification(titulo, {
    body: corpo,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'gestao-tempo-lembrete',
  })
}

/**
 * Verifica as tarefas e envia notificações se necessário.
 */
function verificarTarefas(tarefas) {
  if (jaNotificouHoje()) return

  const { hora, minuto } = getHorarioConfigurado()
  const agora = new Date()
  if (agora.getHours() !== hora || agora.getMinutes() !== minuto) return

  const tarefasUrgentes = tarefas.value.filter((t) => {
    if (t.concluida || !t.dataTarefa) return false
    const dias = diasRestantes(t.dataTarefa)
    return dias >= 0 && dias <= DIAS_ANTES_PRAZO
  })

  if (tarefasUrgentes.length === 0) return

  marcarNotificado()

  if (tarefasUrgentes.length === 1) {
    const t = tarefasUrgentes[0]
    const dias = diasRestantes(t.dataTarefa)
    const prazoTexto = dias === 0 ? 'é HOJE!' : dias === 1 ? 'é amanhã!' : `faltam ${dias} dias!`
    enviarNotificacao(
      `⏰ Tarefa próxima do prazo!`,
      `"${t.nomeTarefa}" — ${prazoTexto}`
    )
  } else {
    const nomes = tarefasUrgentes.map((t) => {
      const dias = diasRestantes(t.dataTarefa)
      const prazoTexto = dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `${dias} dias`
      return `• ${t.nomeTarefa} (${prazoTexto})`
    }).join('\n')

    enviarNotificacao(
      `⏰ ${tarefasUrgentes.length} tarefas próximas do prazo!`,
      nomes
    )
  }
}

/**
 * Composable que ativa o sistema de notificações.
 * Deve ser chamado uma vez no App.vue ou layout principal.
 */
export function useNotificacoes() {
  const { tarefas } = useGamificacao()

  // Horário configurável (reativo para a UI de configurações)
  const horarioNotificacao = ref(
    localStorage.getItem(STORAGE_HORA_NOTIF) || '14:30'
  )

  function salvarHorario(novoHorario) {
    horarioNotificacao.value = novoHorario
    setHorarioConfigurado(novoHorario)
  }

  onMounted(async () => {
    if (ativo) return
    ativo = true

    await pedirPermissao()

    verificarTarefas(tarefas)
    intervalId = setInterval(() => {
      verificarTarefas(tarefas)
    }, 30_000)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    ativo = false
  })

  return {
    horarioNotificacao,
    salvarHorario,
  }
}
