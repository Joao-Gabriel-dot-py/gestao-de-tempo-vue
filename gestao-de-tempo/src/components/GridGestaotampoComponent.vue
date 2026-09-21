<script setup>
import { ref, computed } from 'vue'
import { useGestaoTempo } from '@/composables/useGestaoTempo'

const {
  columns,
  rows,
  getExcelColumnName,
  addRow,
  removeRow,
  clearAll,
} = useGestaoTempo()

// ==========================================
// Dias da semana (mobile)
// ==========================================

const diasSemana = [
  { id: 0, inicial: 'D', nome: 'Domingo' },
  { id: 1, inicial: 'S', nome: 'Segunda' },
  { id: 2, inicial: 'T', nome: 'Terça' },
  { id: 3, inicial: 'Q', nome: 'Quarta' },
  { id: 4, inicial: 'Q', nome: 'Quinta' },
  { id: 5, inicial: 'S', nome: 'Sexta' },
  { id: 6, inicial: 'S', nome: 'Sábado' },
]

// Dia atual selecionado (começa no dia da semana atual)
const diaSelecionado = ref(new Date().getDay())

// Coluna correspondente ao dia selecionado no mobile
const colunaDoDia = computed(() => {
  // Mapeia o dia selecionado para uma coluna existente
  // Se não existir coluna suficiente, retorna a primeira
  return columns.value[diaSelecionado.value] || columns.value[0]
})

// ==========================================
// Cores e pintura
// ==========================================

const presetColors = [
  { name: 'Amarelo', hex: '#fef08a' },
  { name: 'Verde', hex: '#bbf7d0' },
  { name: 'Azul', hex: '#bfdbfe' },
  { name: 'Laranja', hex: '#fed7aa' },
  { name: 'Vermelho', hex: '#fecaca' },
  { name: 'Roxo', hex: '#e9d5ff' },
  { name: 'Cinza', hex: '#e2e8f0' },
]

const customColor = ref('#fef08a')

// Célula atualmente em foco / selecionada
const activeCell = ref({
  rowIdx: 0,
  colIdx: 0,
  colId: 'col_0',
  rowId: 'row_0',
  label: 'A1',
})

// Seleção de célula (desktop)
function onCellFocus(rowIdx, colIdx, colId, rowId) {
  const colLabel = columns.value[colIdx]?.label || getExcelColumnName(colIdx)
  activeCell.value = {
    rowIdx,
    colIdx,
    colId,
    rowId,
    label: `${colLabel}${rowIdx + 1}`,
  }
}

// Seleção de célula (mobile) — sempre usa a coluna do dia selecionado
function onCellFocusMobile(rowIdx, rowId) {
  const col = colunaDoDia.value
  if (!col) return
  const colIdx = columns.value.indexOf(col)
  activeCell.value = {
    rowIdx,
    colIdx,
    colId: col.id,
    rowId,
    label: `${col.label}${rowIdx + 1}`,
  }
}

// Pintar a célula ativa
function paintActiveCell(color) {
  const row = rows.value[activeCell.value.rowIdx]
  if (row) {
    if (!row.colors) row.colors = {}
    if (color) {
      row.colors[activeCell.value.colId] = color
      customColor.value = color
    } else {
      delete row.colors[activeCell.value.colId]
    }
  }
}

// Pintar a linha inteira da célula ativa
function paintActiveRow(color) {
  const row = rows.value[activeCell.value.rowIdx]
  if (row) {
    if (!row.colors) row.colors = {}
    columns.value.forEach(col => {
      if (color) {
        row.colors[col.id] = color
      } else {
        delete row.colors[col.id]
      }
    })
  }
}

// Calcula contraste para garantir legibilidade
function getContrastColor(hexcolor) {
  if (!hexcolor) return ''
  let hex = hexcolor.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#1e293b' : '#ffffff'
}

// Cor da célula atualmente selecionada
const activeCellColor = computed(() => {
  const row = rows.value[activeCell.value.rowIdx]
  return row?.colors?.[activeCell.value.colId] || null
})

// Confirmar antes de limpar
function confirmarLimpar() {
  if (confirm('Deseja limpar todos os dados e cores da planilha?')) {
    clearAll()
  }
}


</script>

<template>
  <!-- ============================================ -->
  <!-- VERSÃO MOBILE (< md) -->
  <!-- ============================================ -->
  <div class="md:hidden">
    <div class="card bg-base-100 shadow-md border border-base-300 w-full overflow-hidden">
      <!-- Seletor de dias da semana -->
      <div class="p-4 border-b border-base-300">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 flex-1 justify-center">
            <button
              v-for="dia in diasSemana"
              :key="dia.id"
              @click="diaSelecionado = dia.id"
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200"
              :class="[
                diaSelecionado === dia.id
                  ? 'bg-primary text-primary-content shadow-md scale-110'
                  : 'bg-base-200 text-base-content/70 hover:bg-base-300 hover:scale-105'
              ]"
              :title="dia.nome"
            >
              {{ dia.inicial }}
            </button>
          </div>
        </div>
        <p class="text-center text-sm font-semibold text-base-content/80 mt-2">
          {{ diasSemana[diaSelecionado].nome }}
        </p>
      </div>

      <!-- Toolbar mobile compacta -->
      <div class="p-3 border-b border-base-300 flex items-center justify-between gap-2">
        <div class="flex items-center gap-1">
          <button class="btn btn-xs btn-outline btn-primary" @click="addRow">+ Linha</button>
          <button class="btn btn-xs btn-ghost text-error" :disabled="rows.length <= 1" @click="removeRow">- Linha</button>
        </div>

        <!-- Mini paleta de cores -->
        <div class="flex items-center gap-1">
          <button
            v-for="color in presetColors.slice(0, 4)"
            :key="color.hex"
            class="w-5 h-5 rounded-full border border-base-content/20 active:scale-90 transition-all"
            :style="{ backgroundColor: color.hex }"
            @click="paintActiveCell(color.hex)"
          />
          <button
            class="btn btn-xs btn-ghost text-error px-1"
            @click="paintActiveCell(null)"
            title="Sem cor"
          >✕</button>
        </div>
      </div>

      <!-- Coluna única do dia selecionado -->
      <div class="max-h-[65vh] overflow-y-auto">
        <div v-if="colunaDoDia" class="divide-y divide-base-300">
          <div
            v-for="(row, rowIdx) in rows"
            :key="row.id"
            class="flex items-center gap-2 px-3 py-0.5 transition-colors"
            :style="{
              backgroundColor: row.colors?.[colunaDoDia.id] || '',
            }"
            :class="{
              'ring-2 ring-primary ring-inset': activeCell.rowIdx === rowIdx && activeCell.colId === colunaDoDia.id
            }"
          >
            <!-- Horário da linha -->
            <div class="w-12 shrink-0">
              <input
                v-model="row.time"
                type="text"
                placeholder="00:00"
                class="w-full text-center font-mono text-xs font-bold bg-transparent border-none outline-none focus:bg-base-100/50 rounded py-1"
                :style="{ color: getContrastColor(row.colors?.[colunaDoDia.id]) || '' }"
              />
            </div>

            <!-- Input da célula -->
            <input
              v-model="row.data[colunaDoDia.id]"
              type="text"
              @focus="onCellFocusMobile(rowIdx, row.id)"
              class="flex-1 h-10 px-2 text-sm bg-transparent border-none outline-none"
              :style="{ color: getContrastColor(row.colors?.[colunaDoDia.id]) }"
              :placeholder="`Atividade ${rowIdx + 1}`"
            />
          </div>
        </div>
      </div>

      <!-- Status bar mobile -->
      <div class="px-3 py-2 bg-base-200/50 border-t border-base-300 text-xs text-base-content/50 text-center font-medium">
        {{ diasSemana[diaSelecionado].nome }}
      </div>
    </div>
  </div>

  <!-- ============================================ -->
  <!-- VERSÃO DESKTOP (>= md) -->
  <!-- ============================================ -->
  <div class="hidden md:block">
    <div class="card bg-base-100 shadow-md border border-base-300 w-full overflow-hidden">
      <!-- Barra de ferramentas superior -->
      <div class="p-4 bg-base-100 border-b border-base-300 flex flex-wrap items-center justify-between gap-3">
        <!-- Info -->
        <div class="flex items-center gap-2">
          <span class="badge badge-primary badge-lg font-semibold">Planilha de Gestão</span>
        </div>

        <!-- Controles de Ação e Pintura -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Grupo de Linhas e Colunas -->
          <div class="flex items-center gap-1.5">
            <button class="btn btn-sm btn-outline btn-primary" @click="addRow">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Linha
            </button>
            <button 
              class="btn btn-sm btn-ghost text-error" 
              :disabled="rows.length <= 1" 
              @click="removeRow" 
              title="Remover última linha"
            >
              - Linha
            </button>

          </div>

          <!-- Grupo de Pintura de Células (Balde de Tinta) -->
          <div class="flex items-center gap-1.5 border-l border-base-300 pl-3">
            <div class="flex items-center gap-1 text-xs font-semibold text-base-content/70" title="Pintar célula">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Pintar:
            </div>

            <!-- Paleta de cores rápidas -->
            <div class="flex items-center gap-1">
              <button
                v-for="color in presetColors"
                :key="color.hex"
                class="w-6 h-6 rounded-full border border-base-content/20 hover:scale-125 active:scale-95 transition-all shadow-xs"
                :style="{ backgroundColor: color.hex }"
                :title="`Pintar célula ativa (${activeCell.label}) de ${color.name}`"
                @click="paintActiveCell(color.hex)"
              />
            </div>

            <!-- Color Picker Personalizado -->
            <label class="relative cursor-pointer ml-0.5" title="Escolher cor personalizada">
              <input
                type="color"
                v-model="customColor"
                @input="paintActiveCell(customColor)"
                class="w-6 h-6 rounded opacity-0 absolute inset-0 cursor-pointer"
              />
              <div class="w-6 h-6 rounded-full border border-base-content/20 flex items-center justify-center bg-gradient-to-tr from-pink-400 via-amber-300 to-sky-400 hover:scale-125 transition-all shadow-xs">
                <span class="text-[10px] font-bold text-white drop-shadow">+</span>
              </div>
            </label>

            <!-- Ações extras de cor -->
            <button
              class="btn btn-xs btn-ghost text-xs ml-1"
              @click="paintActiveRow(customColor)"
              title="Pintar toda a linha atual com a cor selecionada"
            >
              Linha toda
            </button>

            <button
              class="btn btn-xs btn-ghost text-xs text-error"
              @click="paintActiveCell(null)"
              title="Remover cor da célula selecionada"
            >
              Sem Cor
            </button>
          </div>

          <!-- Botão Limpar Geral -->
          <button class="btn btn-sm btn-ghost border-l border-base-300 pl-3" @click="confirmarLimpar" title="Limpar tudo">
            Limpar Tudo
          </button>
        </div>
      </div>

      <!-- Tabela / Grade Spreadsheet -->
      <div class="overflow-x-auto max-h-[600px] select-text">
        <table class="table table-xs w-full border-collapse">
          <!-- Cabeçalho das Colunas -->
          <thead class="sticky top-0 z-10 bg-base-200 text-base-content shadow-xs">
            <tr>
              <th class="w-20 min-w-20 bg-base-300 text-center border border-base-300 select-none font-bold text-xs p-1">
                Horário
              </th>
              <th
                v-for="(col, colIdx) in columns"
                :key="col.id"
                class="min-w-36 text-center border border-base-300 font-bold text-xs p-1 bg-base-200"
              >
                <span class="w-full text-center bg-transparent border-none outline-none font-bold py-1 inline-block">
                  {{ col.label }}
                </span>
              </th>
            </tr>
          </thead>

          <!-- Linhas e Células de Dados -->
          <tbody>
            <tr
              v-for="(row, rowIdx) in rows"
              :key="row.id"
              class="hover:bg-base-200/20 transition-colors"
            >
              <td class="w-20 min-w-20 text-center bg-base-200 border border-base-300 p-0 sticky left-0 z-5">
                <input
                  v-model="row.time"
                  type="text"
                  placeholder="00:00"
                  class="w-full h-9 px-1 text-center font-mono text-xs font-bold text-base-content/70 bg-transparent border-none outline-none focus:bg-base-100"
                />
              </td>

              <td
                v-for="(col, colIdx) in columns"
                :key="col.id"
                class="p-0 border border-base-300 min-w-36 transition-colors"
                :style="{
                  backgroundColor: row.colors?.[col.id] || '',
                  color: getContrastColor(row.colors?.[col.id])
                }"
                :class="{
                  'ring-2 ring-primary ring-inset z-1': activeCell.rowIdx === rowIdx && activeCell.colIdx === colIdx
                }"
              >
                <input
                  v-model="row.data[col.id]"
                  type="text"
                  @focus="onCellFocus(rowIdx, colIdx, col.id, row.id)"
                  class="w-full h-9 px-2 text-sm bg-transparent border-none outline-none focus:outline-none"
                  :style="{
                    color: getContrastColor(row.colors?.[col.id])
                  }"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>


    </div>
  </div>
</template>

<style scoped>
/* Otimizações visuais de planilha */
table {
  border-spacing: 0;
}
input {
  box-sizing: border-box;
}
</style>
