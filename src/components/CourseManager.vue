<script setup>
import { ref } from 'vue';
import axios from 'axios';

// Props
const props = defineProps({
  courses: {
    type: Array,
    required: true
  },
  selectedCourseId: {
    type: [Number, String],
    default: null
  }
});

// Emits
const emit = defineEmits(['select-course', 'import-success']);

// Local state for tracking import statuses per course
// Structure: { [courseId]: { loading: boolean, success: boolean | null, message: string } }
const importStatuses = ref({});

// References for hidden file inputs
const fileInputs = ref({});

const triggerFileInput = (courseId) => {
  if (fileInputs.value[courseId]) {
    fileInputs.value[courseId].click();
  }
};

const handleFileChange = async (e, courseId) => {
  const file = e.target.files[0];
  if (!file) return;

  // Initialize status for this card
  importStatuses.value[courseId] = {
    loading: true,
    success: null,
    message: 'Đang chuẩn bị tải lên...'
  };

  const formData = new FormData();
  formData.append('file', file);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api';

  try {
    const response = await axios.post(`${BASE_URL}/courses/${courseId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    });

    importStatuses.value[courseId] = {
      loading: false,
      success: true,
      message: `Nhập thành công ${response.data.count || 0} từ vựng.`
    };

    // Emit event to notify parent (e.g. reload vocabularies if active)
    emit('import-success', courseId);

    // Reset input
    e.target.value = '';

    // Clear success message after 3 seconds
    setTimeout(() => {
      if (importStatuses.value[courseId]?.success) {
        delete importStatuses.value[courseId];
      }
    }, 3000);

  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ.';
    importStatuses.value[courseId] = {
      loading: false,
      success: false,
      message: `Lỗi: ${errMsg}`
    };

    // Clear error message after 5 seconds
    setTimeout(() => {
      if (importStatuses.value[courseId]?.success === false) {
        delete importStatuses.value[courseId];
      }
    }, 5000);
  }
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div 
      v-for="course in courses" 
      :key="course.id"
      class="bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01]"
      :class="selectedCourseId === course.id 
        ? 'border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/10' 
        : 'border-slate-200 dark:border-slate-700'"
    >
      <!-- Card Header / Info -->
      <div class="p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span 
            v-if="selectedCourseId === course.id"
            class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md"
          >
            Đang Học
          </span>
        </div>

        <h3 class="text-base font-bold text-slate-900 dark:text-white mt-4 line-clamp-1">
          {{ course.title }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 min-h-[2rem]">
          {{ course.description || 'Không có mô tả cho chủ đề này.' }}
        </p>
      </div>

      <!-- Card Action Section -->
      <div class="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-750 flex flex-col gap-4">
        
        <!-- Import Status Notification Inside Card -->
        <div 
          v-if="importStatuses[course.id]" 
          class="p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all"
          :class="[
            importStatuses[course.id].success === true 
              ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
              : importStatuses[course.id].success === false
                ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
          ]"
        >
          <!-- Loading spinner -->
          <svg v-if="importStatuses[course.id].loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <!-- Check icon for success -->
          <svg v-else-if="importStatuses[course.id].success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <!-- Warning/Error icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          
          <span class="truncate">{{ importStatuses[course.id].message }}</span>
        </div>

        <div class="flex items-center gap-3">
          <!-- View Vocab Button -->
          <button 
            @click="emit('select-course', course)"
            class="flex-1 py-2 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all"
          >
            Xem từ vựng
          </button>
          
          <!-- Import CSV Button -->
          <button 
            @click="triggerFileInput(course.id)"
            :disabled="importStatuses[course.id]?.loading"
            class="py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Import CSV
          </button>
        </div>

        <!-- Hidden File Input per card -->
        <input 
          type="file" 
          :ref="el => fileInputs[course.id] = el"
          accept=".csv,.txt"
          @change="(e) => handleFileChange(e, course.id)"
          class="hidden"
        />

      </div>
    </div>
  </div>
</template>
