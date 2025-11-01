// Создай новый файл: src/js/storage.js
class Storage {
  async loadTasks() {
    try {
      const data = localStorage.getItem('tasks');
      return data ? JSON.parse(data) : { day: [], week: [], month: [] };
    } catch {
      return { day: [], week: [], month: [] };
    }
  }

  async saveTasks(tasks) {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  exitApp() {
    // На Android это закроет приложение
    if (window.Capacitor) {
      window.Capacitor.Plugins.App.exitApp();
    } else {
      window.close();
    }
  }
}

const storage = new Storage();
