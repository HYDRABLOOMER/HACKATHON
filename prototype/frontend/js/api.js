class EcoQuestAPI {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.token = localStorage.getItem('ecoquest_token');
  }

  // Helper method for API calls
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const isFormData =
      typeof FormData !== 'undefined' &&
      options.body &&
      options.body instanceof FormData;

    const config = {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  setToken(token) {
    this.token = token;
    localStorage.setItem('ecoquest_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('ecoquest_token');
  }

  // Task-related methods
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.scope) params.append('scope', filters.scope);
    
    const endpoint = params.toString() ? `/tasks?${params.toString()}` : '/tasks';
    return this.request(endpoint);
  }

  async getTaskById(taskId) {
    return this.request(`/tasks/${taskId}`);
  }

  async startTask(taskId) {
    return this.request(`/tasks/${taskId}/start`, {
      method: 'POST'
    });
  }

  async submitEvidence(submissionId, evidence) {
    return this.request(`/tasks/submissions/${submissionId}/submit`, {
      method: 'POST',
      body: JSON.stringify(evidence)
    });
  }

  async submitEvidenceWithImages(submissionId, { description, latitude, longitude, locationText, files } = {}) {
    const form = new FormData();
    if (description != null) form.append('description', String(description));
    if (latitude != null) form.append('latitude', String(latitude));
    if (longitude != null) form.append('longitude', String(longitude));
    if (locationText != null) form.append('locationText', String(locationText));

    if (Array.isArray(files)) {
      files.forEach((f) => {
        if (f) form.append('images', f);
      });
    }

    return this.request(`/tasks/submissions/${submissionId}/submit`, {
      method: 'POST',
      body: form
    });
  }

  async getUserSubmissions(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const endpoint = params.toString() ? `/submissions?${params.toString()}` : '/submissions';
    return this.request(endpoint);
  }

  async getCurrentUser() {
    // Auth routes live at /auth (not under /api)
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }
    const response = await fetch('/auth/me', config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  }

  async updateProfile(profile) {
    const config = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      body: JSON.stringify(profile || {})
    };

    const response = await fetch('/auth/me', config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  }

  async getLeaderboard(limit = 20) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    const endpoint = params.toString() ? `/leaderboard?${params.toString()}` : '/leaderboard';
    return this.request(endpoint);
  }

  // Issues
  async listIssues({ category, status, search } = {}) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const endpoint = params.toString() ? `/issues?${params.toString()}` : '/issues';
    return this.request(endpoint);
  }

  async createIssue(payload) {
    return this.request('/issues', {
      method: 'POST',
      body: JSON.stringify(payload || {})
    });
  }

  // Quiz attempts
  async createQuizAttempt({ topic, score, maxScore }) {
    return this.request('/quiz/attempts', {
      method: 'POST',
      body: JSON.stringify({
        topic: topic || '',
        score: Number(score) || 0,
        maxScore: Number(maxScore) || 0
      })
    });
  }

  async listMyQuizAttempts() {
    return this.request('/quiz/attempts/me');
  }

  // File upload helper (for evidence submission)
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }

  // Geolocation helper
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Unable to get location: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  // Error handling helper
  handleError(error, defaultMessage = 'An error occurred') {
    console.error('API Error:', error);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      this.removeToken();
      window.location.href = '/';
      return 'Session expired. Please login again.';
    }
    
    if (error.message.includes('403')) {
      return 'You do not have permission to perform this action.';
    }
    
    if (error.message.includes('404')) {
      return 'The requested resource was not found.';
    }
    
    if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }
    
    return error.message || defaultMessage;
  }
}

// Create global API instance
window.ecoQuestAPI = new EcoQuestAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoQuestAPI;
}
