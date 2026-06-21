const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Reusable fetch wrapper with content-type handling.
 */
async function request(path, options = {}) {
    const url = `${BASE_URL}${path}`;

    // Set headers
    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {})
    };

    // If it's not a FormData upload, default to JSON
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        let errorData = {};
        try {
            errorData = await response.json();
        } catch (e) {
            // response was not json
        }
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    return response.json();
}

export const api = {
    /**
     * Get list of all courses.
     */
    getCourses() {
        return request('/courses');
    },

    /**
     * Create a new course.
     */
    createCourse(title, description = '') {
        return request('/courses', {
            method: 'POST',
            body: JSON.stringify({ title, description })
        });
    },

    /**
     * Get all vocabularies belonging to a course.
     */
    getVocabulariesByCourse(courseId) {
        return request(`/courses/${courseId}/vocabularies`);
    },

    /**
     * Update a vocabulary record (or its priority).
     */
    updateVocabulary(id, data) {
        return request(`/vocabularies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Update only the priority of a vocabulary record.
     */
    updateVocabularyPriority(id, priority) {
        return this.updateVocabulary(id, { priority });
    },

    /**
     * Get randomized vocabularies for Flashcards.
     */
    getRandomVocabularies(courseId = null, priority = null) {
        const params = new URLSearchParams();
        if (courseId) params.append('course_id', courseId);
        if (priority) params.append('priority', priority);

        const queryString = params.toString() ? `?${params.toString()}` : '';
        return request(`/vocabularies/random${queryString}`);
    },

    /**
     * Import vocabularies in batch via CSV file upload.
     */
    importCSV(courseId, file) {
        const formData = new FormData();
        formData.append('file', file);

        return request(`/courses/${courseId}/import`, {
            method: 'POST',
            body: formData
        });
    },

    /**
     * Create a new vocabulary item.
     */
    createVocabulary(data) {
        return request('/vocabularies', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Delete a course.
     */
    deleteCourse(id) {
        return request(`/courses/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Delete a vocabulary item.
     */
    deleteVocabulary(id) {
        return request(`/vocabularies/${id}`, {
            method: 'DELETE'
        });
    }
};
