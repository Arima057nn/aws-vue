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
const emit = defineEmits(['select-course', 'import-success', 'delete-course']);

// Local state for custom delete confirmation modal
const showConfirmDeleteModal = ref(false);
const courseToDelete = ref(null);

const triggerDeleteCourse = (course) => {
  courseToDelete.value = course;
  showConfirmDeleteModal.value = true;
};

const executeDeleteCourse = () => {
  if (courseToDelete.value) {
    emit('delete-course', courseToDelete.value.id);
  }
  showConfirmDeleteModal.value = false;
  courseToDelete.value = null;
};

const cancelDeleteCourse = () => {
  showConfirmDeleteModal.value = false;
  courseToDelete.value = null;
};

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

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
          <div class="flex items-center gap-2">
            <span 
              v-if="selectedCourseId === course.id"
              class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md"
            >
              Đang Học
            </span>
            <button 
              @click.stop="triggerDeleteCourse(course)"
              class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              title="Xóa khóa học"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
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

    <!-- MODAL: CONFIRM DELETE COURSE -->
    <div 
      v-show="showConfirmDeleteModal" 
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
    >
      <div 
        class="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-8 relative text-center transform transition-all duration-300"
      >
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        
        <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Xác nhận xóa khóa học</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Bạn có chắc chắn muốn xóa khóa học <strong class="text-slate-800 dark:text-slate-200">"{{ courseToDelete?.title }}"</strong>?<br>
          Hành động này sẽ xóa vĩnh viễn khóa học này và <span class="text-red-500 font-semibold">tất cả từ vựng bên trong</span>. Thao tác này không thể hoàn tác.
        </p>

        <div class="flex items-center gap-3">
          <button 
            @click="cancelDeleteCourse"
            class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            @click="executeDeleteCourse"
            class="flex-1 py-3 bg-red-650 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-red-500/10"
          >
            Xóa khóa học
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
