<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from './api';
import CourseManager from './components/CourseManager.vue';
import VocabularyList from './components/VocabularyList.vue';
import FlashcardStudy from './components/FlashcardStudy.vue';

// Navigation & Tabs
const activeTab = ref('courses'); // 'courses' | 'flashcards'

// Courses & Vocabularies state
const courses = ref([]);
const selectedCourse = ref(null);
const vocabularies = ref([]);
const loading = ref(false);
const errorMsg = ref('');

// Modals & Forms
const isAddingCourse = ref(false);
const newCourseTitle = ref('');
const newCourseDesc = ref('');

const isImporting = ref(false);
const selectedFile = ref(null);
const importMsg = ref('');
const importSuccess = ref(null);

const showExampleModal = ref(false);
const activeVocab = ref(null);

// Flashcards (Spaced Repetition) state
const flashcards = ref([]);
const currentCardIndex = ref(0);
const isFlipped = ref(false);
const flashcardPriorityFilter = ref('');

// Helper colors for Priority levels
const priorityColors = {
  1: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-800', label: 'Loại 1 - Mới' },
  2: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-800', label: 'Loại 2 - Đang học' },
  3: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-800', label: 'Loại 3 - Đã nhớ' },
  4: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-300 dark:border-red-800', label: 'Loại 4 - Cần ôn lại' }
};

// Lifecycle: fetch all courses
const fetchCourses = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const data = await api.getCourses();
    courses.value = data;
    if (data.length > 0 && !selectedCourse.value) {
      selectCourse(data[0]);
    }
  } catch (err) {
    errorMsg.value = 'Không thể tải danh sách khóa học: ' + err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCourses();
});

// Select a course and load its vocabularies
const selectCourse = async (course) => {
  selectedCourse.value = course;
  loading.value = true;
  errorMsg.value = '';
  try {
    const data = await api.getVocabulariesByCourse(course.id);
    vocabularies.value = data;
  } catch (err) {
    errorMsg.value = 'Không thể tải danh sách từ vựng: ' + err.message;
  } finally {
    loading.value = false;
  }
};

// Add new course
const handleAddCourse = async () => {
  if (!newCourseTitle.value.trim()) return;
  try {
    const newCourse = await api.createCourse(newCourseTitle.value, newCourseDesc.value);
    courses.value.push(newCourse);
    selectCourse(newCourse);
    newCourseTitle.value = '';
    newCourseDesc.value = '';
    isAddingCourse.value = false;
  } catch (err) {
    alert('Không thể tạo khóa học: ' + err.message);
  }
};

// File Selection
const handleFileChange = (e) => {
  selectedFile.value = e.target.files[0];
};

// Upload CSV file
const handleCSVImport = async () => {
  if (!selectedFile.value || !selectedCourse.value) return;
  importMsg.value = 'Đang tải lên dữ liệu...';
  importSuccess.value = null;
  try {
    const res = await api.importCSV(selectedCourse.value.id, selectedFile.value);
    importSuccess.value = true;
    importMsg.value = `Nhập thành công ${res.count} từ vựng mới vào khóa học.`;
    selectedFile.value = null;
    // Reload vocabularies
    selectCourse(selectedCourse.value);
    setTimeout(() => {
      isImporting.value = false;
      importMsg.value = '';
      importSuccess.value = null;
    }, 2000);
  } catch (err) {
    importSuccess.value = false;
    importMsg.value = 'Nhập thất bại: ' + err.message;
  }
};

// Update Priority
const handlePriorityChange = async (vocab, newPriority) => {
  try {
    const updated = await api.updateVocabularyPriority(vocab.id, parseInt(newPriority));
    // Update local state
    const index = vocabularies.value.findIndex(v => v.id === vocab.id);
    if (index !== -1) {
      vocabularies.value[index] = updated;
    }
    // Update flashcard in-place if active
    const cardIndex = flashcards.value.findIndex(v => v.id === vocab.id);
    if (cardIndex !== -1) {
      flashcards.value[cardIndex] = updated;
    }
  } catch (err) {
    alert('Lỗi cập nhật độ ưu tiên: ' + err.message);
  }
};

const handlePriorityUpdated = (updatedVocab) => {
  const index = vocabularies.value.findIndex(v => v.id === updatedVocab.id);
  if (index !== -1) {
    vocabularies.value[index] = updatedVocab;
  }
};

// Flashcard Controls
const startFlashcards = async () => {
  loading.value = true;
  isFlipped.value = false;
  currentCardIndex.value = 0;
  try {
    const cId = selectedCourse.value ? selectedCourse.value.id : null;
    const priority = flashcardPriorityFilter.value || null;
    const data = await api.getRandomVocabularies(cId, priority);
    flashcards.value = data;
    activeTab.value = 'flashcards';
  } catch (err) {
    alert('Không thể tải Flashcards ngẫu nhiên: ' + err.message);
  } finally {
    loading.value = false;
  }
};

const handleFlashcardPriority = async (newPriority) => {
  const currentCard = flashcards.value[currentCardIndex.value];
  if (!currentCard) return;
  
  await handlePriorityChange(currentCard, newPriority);
  
  // Slide to next card after a small delay
  setTimeout(() => {
    nextCard();
  }, 300);
};

const nextCard = () => {
  isFlipped.value = false;
  if (currentCardIndex.value < flashcards.value.length - 1) {
    currentCardIndex.value++;
  } else {
    // Loop back to start or alert
    alert('Chúc mừng! Bạn đã hoàn thành tất cả Flashcards trong bộ lọc.');
    currentCardIndex.value = 0;
  }
};

const prevCard = () => {
  isFlipped.value = false;
  if (currentCardIndex.value > 0) {
    currentCardIndex.value--;
  }
};

const openExample = (vocab) => {
  activeVocab.value = vocab;
  showExampleModal.value = true;
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
    <!-- Header Dashboard -->
    <header class="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              Japanese Flashcard
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">Học từ vựng & Spaced Repetition</p>
          </div>
        </div>

        <nav class="flex items-center gap-2">
          <button 
            @click="activeTab = 'courses'" 
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="activeTab === 'courses' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
          >
            Bài Học & Từ Vựng
          </button>
          <button 
            @click="startFlashcards" 
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="activeTab === 'flashcards' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
          >
            Học Flashcards
          </button>
        </nav>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- TAB 1: COURSES & VOCABULARIES -->
      <div v-if="activeTab === 'courses'" class="flex flex-col gap-8">
        
        <!-- Course Cards Grid -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Chủ đề bài học của bạn</h2>
            <button 
              @click="isAddingCourse = true" 
              class="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tạo bài học mới
            </button>
          </div>
          
          <CourseManager 
            :courses="courses" 
            :selectedCourseId="selectedCourse?.id" 
            @select-course="selectCourse" 
            @import-success="selectCourse" 
          />
        </div>

        <!-- Selected Course Vocabularies Panel -->
        <div v-if="selectedCourse" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <!-- Panel Header -->
          <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Danh sách từ vựng: {{ selectedCourse.title }}</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ selectedCourse.description || 'Không có mô tả bài học.' }}</p>
            </div>
            
            <div class="flex items-center gap-2">
              <button 
                @click="startFlashcards" 
                class="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-colors shadow-md shadow-indigo-600/10"
              >
                Luyện Tập Flashcards
              </button>
            </div>
          </div>

          <!-- Vocabulary Table -->
          <VocabularyList 
            :vocabularies="vocabularies" 
            @priority-updated="handlePriorityUpdated" 
          />
        </div>
      </div>

      <!-- TAB 2: FLASHCARDS (STUDY MODE) -->
      <!-- TAB 2: FLASHCARDS (STUDY MODE) -->
      <div v-else-if="activeTab === 'flashcards'">
        <FlashcardStudy 
          :courses="courses" 
          :initialCourseId="selectedCourse?.id" 
        />
      </div>

    </main>

    <!-- MODAL: ADD COURSE -->
    <div v-show="isAddingCourse" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Tạo khóa học / chủ đề mới</h3>
        <button @click="isAddingCourse = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <form @submit.prevent="handleAddCourse" class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tiêu đề bài học</label>
            <input 
              v-model="newCourseTitle" 
              type="text" 
              placeholder="VD: Tiếng Nhật Giao Tiếp N4, Từ vựng Shinjuku..."
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 outline-none text-sm focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Mô tả bài học</label>
            <textarea 
              v-model="newCourseDesc" 
              placeholder="Tóm tắt nội dung bài học..."
              rows="3"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 outline-none text-sm focus:border-indigo-500 resize-none"
            ></textarea>
          </div>

          <button 
            type="submit" 
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Tạo Mới
          </button>
        </form>
      </div>
    </div>

    <!-- MODAL: IMPORT CSV -->
    <div v-show="isImporting" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Import từ vựng hàng loạt</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Tải lên file `.csv` chứa các cột tiêu chuẩn: <code class="bg-slate-100 dark:bg-slate-900 text-indigo-500">word,category,meaning,example,priority</code>. Đảm bảo mã hóa file dạng **UTF-8** để hiển thị đúng chữ tiếng Nhật.
        </p>

        <button @click="isImporting = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="flex flex-col gap-4">
          <div class="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-indigo-400 dark:hover:border-indigo-800 cursor-pointer relative transition-colors">
            <input 
              type="file" 
              accept=".csv,.txt"
              @change="handleFileChange"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mx-auto text-slate-400 mb-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
              {{ selectedFile ? selectedFile.name : 'Nhấp hoặc thả file CSV vào đây' }}
            </span>
          </div>

          <div v-show="importMsg" class="p-3 rounded-xl text-xs font-semibold text-center" :class="importSuccess === true ? 'bg-green-50 text-green-600 dark:bg-green-950/20' : importSuccess === false ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'">
            {{ importMsg }}
          </div>

          <button 
            @click="handleCSVImport" 
            :disabled="!selectedFile"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all"
          >
            Nhập Dữ Liệu
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: EXAMPLE MODAL -->
    <div v-show="showExampleModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Chi tiết từ vựng</h3>
        
        <button @click="showExampleModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div v-if="activeVocab" class="flex flex-col gap-4 mt-4">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Từ vựng (Gốc)</span>
            <h4 class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{{ activeVocab.word }}</h4>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Loại từ</span>
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{{ activeVocab.category || 'Không xác định' }}</p>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Trạng thái</span>
              <span class="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded border" :class="[priorityColors[activeVocab.priority].text, priorityColors[activeVocab.priority].bg, priorityColors[activeVocab.priority].border]">
                {{ priorityColors[activeVocab.priority].label }}
              </span>
            </div>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ý nghĩa</span>
            <p class="text-base font-medium text-slate-800 dark:text-slate-200 mt-0.5">{{ activeVocab.meaning }}</p>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ví dụ minh họa</span>
            <div class="mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 font-medium text-slate-600 dark:text-slate-350 leading-relaxed">
              {{ activeVocab.example || 'Chưa có câu ví dụ mẫu.' }}
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* Flip Card Specific CSS */
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
