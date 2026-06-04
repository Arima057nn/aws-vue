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
const emit = defineEmits(['priority-updated', 'vocabulary-deleted', 'vocabulary-updated']);

// Local state for detailed Modal
const showModal = ref(false);
const activeVocab = ref(null);

// Local state for editing vocabulary
const showEditModal = ref(false);
const isSubmitting = ref(false);
const editForm = ref({
  id: null,
  word: '',
  category: '',
  meaning: '',
  example: '',
  priority: 1
});

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

const openEditModal = (vocab) => {
  editForm.value = {
    id: vocab.id,
    word: vocab.word,
    category: vocab.category || '',
    meaning: vocab.meaning,
    example: vocab.example || '',
    priority: vocab.priority
  };
  showEditModal.value = true;
};

const handleEditSubmit = async () => {
  if (!editForm.value.word.trim() || !editForm.value.meaning.trim()) {
    alert('Vui lòng điền đầy đủ Từ vựng và Ý nghĩa.');
    return;
  }
  isSubmitting.value = true;
  try {
    const updated = await api.updateVocabulary(editForm.value.id, {
      word: editForm.value.word,
      category: editForm.value.category || null,
      meaning: editForm.value.meaning,
      example: editForm.value.example || null,
      priority: parseInt(editForm.value.priority)
    });
    emit('vocabulary-updated', updated);
    showEditModal.value = false;
  } catch (err) {
    alert('Lỗi cập nhật từ vựng: ' + err.message);
  } finally {
    isSubmitting.value = false;
  }
};

const showConfirmDeleteModal = ref(false);
const vocabToDelete = ref(null);
const isDeleting = ref(false);

const triggerDeleteVocabulary = (vocab) => {
  vocabToDelete.value = vocab;
  showConfirmDeleteModal.value = true;
};

const executeDeleteVocabulary = async () => {
  if (!vocabToDelete.value) return;
  isDeleting.value = true;
  try {
    await api.deleteVocabulary(vocabToDelete.value.id);
    emit('vocabulary-deleted', vocabToDelete.value.id);
    showConfirmDeleteModal.value = false;
    vocabToDelete.value = null;
  } catch (err) {
    alert('Lỗi khi xóa từ vựng: ' + err.message);
  } finally {
    isDeleting.value = false;
  }
};

const cancelDeleteVocabulary = () => {
  showConfirmDeleteModal.value = false;
  vocabToDelete.value = null;
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
              <div class="flex items-center justify-center gap-2">
                <!-- View Details -->
                <button 
                  @click="openExample(vocab)" 
                  class="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                  title="Xem chi tiết"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>
                <!-- Edit -->
                <button 
                  @click="openEditModal(vocab)" 
                  class="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all"
                  title="Chỉnh sửa từ vựng"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <!-- Delete -->
                <button 
                  @click="triggerDeleteVocabulary(vocab)" 
                  class="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all"
                  title="Xóa từ vựng"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
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

    <!-- MODAL: EDIT VOCABULARY -->
    <div 
      v-show="showEditModal" 
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
    >
      <div 
        class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-8 relative transform transition-transform duration-300"
      >
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Chỉnh sửa từ vựng</h3>
        
        <!-- Close Button -->
        <button 
          @click="showEditModal = false" 
          class="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <form @submit.prevent="handleEditSubmit" class="flex flex-col gap-5 mt-6">
          <!-- Word -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Từ gốc (Japanese)</label>
            <input 
              v-model="editForm.word" 
              type="text" 
              placeholder="VD: 食べる, 勉強, 嬉しい..."
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Category -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Loại từ</label>
              <select 
                v-model="editForm.category"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all cursor-pointer"
              >
                <option value="">Không xác định</option>
                <option value="Danh từ">Danh từ</option>
                <option value="Động từ">Động từ</option>
                <option value="Tính từ -i">Tính từ -i</option>
                <option value="Tính từ -na">Tính từ -na</option>
                <option value="Trạng từ">Trạng từ</option>
                <option value="Giới từ">Giới từ</option>
                <option value="Liên từ">Liên từ</option>
                <option value="Cụm từ">Cụm từ</option>
                <option value="Ngữ pháp">Ngữ pháp</option>
                <option value="Thán từ">Thán từ</option>
              </select>
            </div>
            
            <!-- Priority -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Trạng thái (Độ ưu tiên)</label>
              <select 
                v-model="editForm.priority"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all cursor-pointer"
              >
                <option value="1">Loại 1 - Mới</option>
                <option value="2">Loại 2 - Đang học</option>
                <option value="3">Loại 3 - Đã nhớ</option>
                <option value="4">Loại 4 - Cần ôn lại</option>
              </select>
            </div>
          </div>

          <!-- Meaning -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Ý nghĩa (Tiếng Việt)</label>
            <input 
              v-model="editForm.meaning" 
              type="text" 
              placeholder="Nghĩa của từ..."
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              required
            />
          </div>

          <!-- Example -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Ví dụ minh họa</label>
            <textarea 
              v-model="editForm.example" 
              placeholder="VD: 毎日ご飯を食べます。(Mỗi ngày tôi đều ăn cơm)..."
              rows="3"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all resize-none"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <div class="flex items-center gap-3 mt-2">
            <button 
              type="button"
              @click="showEditModal = false"
              class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2"
            >
              <svg v-if="isSubmitting" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CONFIRM DELETE VOCABULARY -->
    <div 
      v-show="showConfirmDeleteModal" 
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
    >
      <div 
        class="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-8 relative text-center transform transition-all duration-300"
      >
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        
        <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Xác nhận xóa từ vựng</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Bạn có chắc chắn muốn xóa từ vựng <strong class="text-slate-800 dark:text-slate-200">"{{ vocabToDelete?.word }}"</strong>?<br>
          Hành động này sẽ xóa vĩnh viễn từ vựng này khỏi cơ sở dữ liệu. Thao tác này không thể hoàn tác.
        </p>

        <div class="flex items-center gap-3">
          <button 
            @click="cancelDeleteVocabulary"
            :disabled="isDeleting"
            class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            @click="executeDeleteVocabulary"
            :disabled="isDeleting"
            class="flex-1 py-3 bg-red-650 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 flex items-center justify-center gap-2"
          >
            <svg v-if="isDeleting" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isDeleting ? 'Đang xóa...' : 'Xóa từ vựng' }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
