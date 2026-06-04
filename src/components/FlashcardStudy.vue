<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';

// Props
const props = defineProps({
  courses: {
    type: Array,
    required: true
  },
  initialCourseId: {
    type: [Number, String],
    default: ''
  }
});

// State
const selectedCourseId = ref(props.initialCourseId || '');
const selectedPriority = ref('');
const flashcards = ref([]);
const currentIndex = ref(0);
const isFlipped = ref(false);
const loading = ref(false);
const showCompletionModal = ref(false);

// Styling helpers for Priority
const priorityColors = {
  1: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', label: 'Loại 1 - Mới' },
  2: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', border: 'border-yellow-200 dark:border-yellow-800', label: 'Loại 2 - Đang học' },
  3: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-200 dark:border-green-800', label: 'Loại 3 - Đã nhớ' },
  4: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', label: 'Loại 4 - Cần ôn lại' }
};

// Fetch randomized flashcards based on active filters
const loadFlashcards = async () => {
  loading.value = true;
  isFlipped.value = false;
  currentIndex.value = 0;
  try {
    const data = await api.getRandomVocabularies(
      selectedCourseId.value || null,
      selectedPriority.value || null
    );
    flashcards.value = data;
  } catch (err) {
    alert('Không thể tải Flashcards ngẫu nhiên: ' + err.message);
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadFlashcards();
});

// Flip active card
const toggleFlip = () => {
  isFlipped.value = !isFlipped.value;
};

// Handle priority reassessment and auto-advance
const handleReassessPriority = async (newPriority) => {
  const currentCard = flashcards.value[currentIndex.value];
  if (!currentCard) return;

  try {
    // Immediate API Call to save priority in Database
    await api.updateVocabularyPriority(currentCard.id, parseInt(newPriority));
    
    // Slide to the next card after a small delay
    setTimeout(() => {
      nextCard();
    }, 300);

  } catch (err) {
    alert('Không thể cập nhật độ ưu tiên của thẻ này: ' + err.message);
  }
};

// Next Card
const nextCard = () => {
  isFlipped.value = false;
  if (currentIndex.value < flashcards.value.length - 1) {
    currentIndex.value++;
  } else {
    showCompletionModal.value = true;
    currentIndex.value = 0;
  }
};

// Previous Card
const prevCard = () => {
  isFlipped.value = false;
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

// Restart study from beginning
const restartStudy = () => {
  showCompletionModal.value = false;
  loadFlashcards();
};
</script>

<template>
  <div class="max-w-xl mx-auto flex flex-col gap-6">
    
    <!-- Filters Header Panel -->
    <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Bộ lọc luyện tập Flashcard
        </h3>
        <button 
          @click="loadFlashcards" 
          class="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Trộn Lại
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Course Filter -->
        <div>
          <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Khóa học</label>
          <select 
            v-model="selectedCourseId"
            @change="loadFlashcards"
            class="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:border-indigo-500"
          >
            <option value="">Tất cả khóa học</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.title }}
            </option>
          </select>
        </div>

        <!-- Priority Filter -->
        <div>
          <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Độ ưu tiên</label>
          <select 
            v-model="selectedPriority"
            @change="loadFlashcards"
            class="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:border-indigo-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Loại 1 - Mới</option>
            <option value="2">Loại 2 - Đang học</option>
            <option value="3">Loại 3 - Đã nhớ</option>
            <option value="4">Loại 4 - Cần ôn lại</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div v-if="flashcards.length > 0 && !loading" class="flex items-center justify-between text-xs font-bold text-slate-500">
      <span>Thẻ số: {{ currentIndex + 1 }} / {{ flashcards.length }}</span>
      <div class="w-2/3 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ml-4">
        <div 
          class="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
          :style="{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- MAIN 3D FLASHCARD BOX -->
    <div v-if="loading" class="h-80 w-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
      <svg class="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <div 
      v-else-if="flashcards.length > 0" 
      @click="toggleFlip"
      class="h-80 w-full relative cursor-pointer select-none perspective-1000"
    >
      <!-- Card Container supporting 3D Rotation -->
      <div 
        class="w-full h-full duration-500 transform-style-3d relative rounded-3xl border shadow-xl flex items-center justify-center p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800"
        :class="{ 'rotate-y-180': isFlipped }"
      >
        <!-- FRONT SIDE -->
        <div v-show="!isFlipped" class="absolute inset-0 flex flex-col justify-between p-8 backface-hidden">
          <div class="flex justify-between items-center text-xs">
            <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              Mặt Trước (Từ gốc)
            </span>
            <span 
              class="px-2.5 py-1 rounded-full border text-[10px] uppercase font-bold"
              :class="[priorityColors[flashcards[currentIndex].priority].text, priorityColors[flashcards[currentIndex].priority].bg, priorityColors[flashcards[currentIndex].priority].border]"
            >
              {{ priorityColors[flashcards[currentIndex].priority].label }}
            </span>
          </div>

          <div class="text-center">
            <h3 class="text-4xl md:text-5xl font-black tracking-wide text-indigo-600 dark:text-indigo-400">
              {{ flashcards[currentIndex].word }}
            </h3>
          </div>

          <div class="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Bấm Lật (Flip)</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 animate-bounce">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
        </div>

        <!-- BACK SIDE -->
        <div v-show="isFlipped" class="absolute inset-0 flex flex-col justify-between p-8 backface-hidden rotate-y-180">
          <div class="flex justify-between items-center text-xs">
            <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              Mặt Sau (Dịch nghĩa)
            </span>
            <span class="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase">
              {{ flashcards[currentIndex].category || 'Chưa phân loại' }}
            </span>
          </div>

          <div class="text-center flex flex-col gap-4">
            <h4 class="text-3xl font-extrabold text-slate-900 dark:text-white">
              {{ flashcards[currentIndex].meaning }}
            </h4>
            <div 
              v-if="flashcards[currentIndex].example" 
              class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-850 max-w-sm mx-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-semibold"
            >
              {{ flashcards[currentIndex].example }}
            </div>
          </div>

          <div class="text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Nhấp thẻ để quay lại mặt trước
          </div>
        </div>

      </div>
    </div>

    <div v-else class="text-center p-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-500">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto mb-3 text-slate-400">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <p class="text-sm font-semibold">Không tìm thấy từ vựng nào khớp với bộ lọc hiện tại.</p>
      <p class="text-xs text-slate-400 mt-1">Hãy đổi bộ lọc hoặc điền thêm từ vựng cho chủ đề học này.</p>
    </div>

    <!-- PAGINATION & REASSESS BUTTONS -->
    <div v-if="flashcards.length > 0 && !loading" class="flex flex-col gap-4">
      
      <!-- Manual Next/Prev Cards -->
      <div class="flex items-center justify-between gap-4">
        <button 
          @click.stop="prevCard" 
          :disabled="currentIndex === 0"
          class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-350 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          Lùi lại
        </button>
        <button 
          @click.stop="nextCard" 
          class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
        >
          Tiếp theo
        </button>
      </div>

      <!-- Quick Priority Assessment buttons -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm">
        <h5 class="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
          Đánh giá nhanh độ ưu tiên (Auto-Save & Next)
        </h5>
        
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button 
            v-for="(config, key) in priorityColors" 
            :key="key"
            @click.stop="handleReassessPriority(key)"
            class="py-3 px-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 shadow-sm"
            :class="[config.text, config.bg, config.border]"
          >
            {{ config.label }}
          </button>
        </div>
      </div>

    </div>

    <!-- MODAL: COMPLETION FLASHCARD STUDY -->
    <div 
      v-show="showCompletionModal" 
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
    >
      <div 
        class="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-8 relative text-center transform transition-all duration-300"
      >
        <!-- Confetti/Trophy Icon -->
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 mb-5 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.875V10.5h.875c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v3.75c0 .621.504 1.125 1.125 1.125h.875V14.25h-.875A1.125 1.125 0 0 0 3 15.375v3.375M16.5 18.75h-9M18 10.25h.75A2.25 2.25 0 0 0 21 8V6a2.25 2.25 0 0 0-2.25-2.25H18m-12 8.5H5.25A2.25 2.25 0 0 1 3 10V8a2.25 2.25 0 0 1 2.25-2.25H6" />
          </svg>
        </div>
        
        <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-2">Chúc mừng!</h3>
        <p class="text-sm text-slate-555 dark:text-slate-400 mb-6 leading-relaxed">
          Bạn đã hoàn thành lượt ôn tập tất cả các Flashcards hiện tại trong bộ lọc này.<br>
          Hãy tiếp tục luyện tập hoặc thay đổi bộ lọc để học thêm các từ vựng mới.
        </p>

        <div class="flex flex-col sm:flex-row items-center gap-3">
          <button 
            @click="restartStudy"
            class="w-full sm:flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Học lại từ đầu
          </button>
          <button 
            @click="showCompletionModal = false"
            class="w-full sm:flex-1 py-3 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-650 rounded-xl text-xs transition-all cursor-pointer"
          >
            Tuyệt vời!
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* 3D Flip Card specific parameters */
.perspective-1000 {
  perspective: 1000px;
}
.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.transform-style-3d {
  transform-style: preserve-3d;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>
