<script setup>
import { ref } from 'vue';
import { api } from '../api';

// Props
const props = defineProps({
  vocabularies: {
    type: Array,
    required: true
  }
});

// Emits
const emit = defineEmits(['priority-updated']);

// Local state for detailed Modal
const showModal = ref(false);
const activeVocab = ref(null);

// Priority styling helper
const priorityColors = {
  1: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', label: 'Loại 1 - Mới' },
  2: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', border: 'border-yellow-200 dark:border-yellow-800', label: 'Loại 2 - Đang học' },
  3: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-200 dark:border-green-800', label: 'Loại 3 - Đã nhớ' },
  4: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', label: 'Loại 4 - Cần ôn lại' }
};

// Handle select change and update database immediately
const handlePriorityChange = async (vocabId, newPriority) => {
  try {
    const updatedVocab = await api.updateVocabularyPriority(vocabId, parseInt(newPriority));
    
    // Emit event so the parent state can be synchronized
    emit('priority-updated', updatedVocab);
  } catch (err) {
    alert('Không thể cập nhật độ ưu tiên dưới database: ' + err.message);
  }
};

const openExample = (vocab) => {
  activeVocab.value = vocab;
  showModal.value = true;
};
</script>

<template>
  <div class="flex-grow flex flex-col justify-between">
    
    <!-- Table Display of Vocabularies -->
    <div v-if="vocabularies.length > 0" class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <th class="px-6 py-4">Từ vựng (Gốc)</th>
            <th class="px-6 py-4">Loại từ</th>
            <th class="px-6 py-4">Ý nghĩa</th>
            <th class="px-6 py-4">Độ ưu tiên</th>
            <th class="px-6 py-4 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr 
            v-for="vocab in vocabularies" 
            :key="vocab.id" 
            class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <!-- Word -->
            <td class="px-6 py-4 font-extrabold text-lg text-indigo-600 dark:text-indigo-400">
              {{ vocab.word }}
            </td>
            <!-- Category -->
            <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-350">
              {{ vocab.category || 'N/A' }}
            </td>
            <!-- Meaning -->
            <td class="px-6 py-4 text-sm text-slate-700 dark:text-slate-200 font-semibold max-w-xs truncate">
              {{ vocab.meaning }}
            </td>
            <!-- Priority Selector -->
            <td class="px-6 py-4 text-sm">
              <select 
                @change="(e) => handlePriorityChange(vocab.id, e.target.value)" 
                :value="vocab.priority"
                class="text-xs font-semibold rounded-full px-3 py-1.5 border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20"
                :class="[priorityColors[vocab.priority].text, priorityColors[vocab.priority].bg, priorityColors[vocab.priority].border]"
              >
                <option value="1">Loại 1 - Mới</option>
                <option value="2">Loại 2 - Đang học</option>
                <option value="3">Loại 3 - Đã nhớ</option>
                <option value="4">Loại 4 - Cần ôn lại</option>
              </select>
            </td>
            <!-- Actions -->
            <td class="px-6 py-4 text-center">
              <button 
                @click="openExample(vocab)" 
                class="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
              >
                Xem Ví Dụ
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="flex-grow flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mb-3 text-slate-400">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <p class="text-sm">Chưa có từ vựng nào trong bài học này.</p>
      <p class="text-xs text-slate-400 mt-1">Hãy nhấp "Import CSV" trên thẻ bài học để thêm từ vựng hàng loạt.</p>
    </div>

    <!-- MODAL: EXAMPLES & DETAILS -->
    <div 
      v-show="showModal" 
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
    >
      <div 
        class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-8 relative transform transition-transform duration-300"
      >
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Chi tiết từ vựng</h3>
        
        <!-- Close Button -->
        <button 
          @click="showModal = false" 
          class="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div v-if="activeVocab" class="flex flex-col gap-6 mt-6">
          
          <!-- Word Block -->
          <div class="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
            <span class="text-[10px] uppercase font-extrabold tracking-widest text-indigo-500/80 block">Từ vựng (Gốc)</span>
            <h4 class="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{{ activeVocab.word }}</h4>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <!-- Category -->
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Loại từ</span>
              <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{{ activeVocab.category || 'Không xác định' }}</p>
            </div>
            
            <!-- Priority -->
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Trạng thái</span>
              <span 
                class="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full border" 
                :class="[priorityColors[activeVocab.priority].text, priorityColors[activeVocab.priority].bg, priorityColors[activeVocab.priority].border]"
              >
                {{ priorityColors[activeVocab.priority].label }}
              </span>
            </div>
          </div>

          <!-- Meaning -->
          <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Ý nghĩa</span>
            <p class="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-relaxed">{{ activeVocab.meaning }}</p>
          </div>

          <!-- Example -->
          <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Ví dụ minh họa</span>
            <div class="mt-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700 text-slate-655 dark:text-slate-300 font-medium leading-relaxed">
              {{ activeVocab.example || 'Chưa có câu ví dụ mẫu.' }}
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
