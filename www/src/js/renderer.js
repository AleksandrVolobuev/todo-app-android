// ============================================================================
// 1. STORAGE SERVICE - Работа с хранилищем данных
// ============================================================================
class StorageService {
  constructor() {
    this.storageKey = 'tasks';
    this.langKey = 'language';
  }

  async loadTasks() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : this.getEmptyTaskStructure();
    } catch (error) {
      console.error('Error loading tasks:', error);
      return this.getEmptyTaskStructure();
    }
  }

  async saveTasks(tasks) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
      return { success: true };
    } catch (error) {
      console.error('Error saving tasks:', error);
      return { success: false, error: error.message };
    }
  }

  getLanguage() {
    return localStorage.getItem(this.langKey) || 'uk';
  }

  setLanguage(lang) {
    localStorage.setItem(this.langKey, lang);
  }

  getEmptyTaskStructure() {
    return { day: [], week: [], month: [] };
  }

  async exitApp() {
    if (window.Capacitor?.Plugins?.App) {
      await window.Capacitor.Plugins.App.exitApp();
    } else {
      window.close();
    }
  }
}

// ============================================================================
// 2. TRANSLATION SERVICE - Управление переводами
// ============================================================================
class TranslationService {
  constructor() {
    this.translations = {
      uk: {
        title: "Мої завдання",
        day: "День",
        week: "Тиждень",
        month: "Місяць",
        add: "+ Додати",
        add_task: "Додати завдання",
        edit_task: "Редагувати завдання",
        save: "Зберегти",
        cancel: "Скасувати",
        exit: "Вийти",
        enter_task: "Введіть завдання...",
        confirm_delete: "Видалити це завдання?",
        empty_task: "Введіть текст завдання",
        confirm_exit: "Ви впевнені, що хочете вийти?"
      },
      ru: {
        title: "Мои задачи",
        day: "День",
        week: "Неделя",
        month: "Месяц",
        add: "+ Добавить",
        add_task: "Добавить задачу",
        edit_task: "Редактировать задачу",
        save: "Сохранить",
        cancel: "Отмена",
        exit: "Выйти",
        enter_task: "Введите задачу...",
        confirm_delete: "Удалить эту задачу?",
        empty_task: "Введите текст задачи",
        confirm_exit: "Вы уверены, что хотите выйти?"
      },
      en: {
        title: "My Tasks",
        day: "Day",
        week: "Week",
        month: "Month",
        add: "+ Add",
        add_task: "Add task",
        edit_task: "Edit task",
        save: "Save",
        cancel: "Cancel",
        exit: "Exit",
        enter_task: "Enter task...",
        confirm_delete: "Delete this task?",
        empty_task: "Enter task text",
        confirm_exit: "Are you sure you want to exit?"
      }
    };
    this.currentLang = 'uk';
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
    }
  }

  getLanguage() {
    return this.currentLang;
  }

  translate(key) {
    return this.translations[this.currentLang]?.[key] || key;
  }

  applyTranslations() {
    // Перевод текстового контента
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.translate(key);
    });
    
    // Перевод placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.translate(key);
    });
    
    document.documentElement.lang = this.currentLang;
  }
}

// ============================================================================
// 3. TASK MODEL - Модель задачи
// ============================================================================
class Task {
  constructor(text, date = null, completed = false) {
    this.text = text;
    this.date = date;
    this.completed = completed;
  }

  toggle() {
    this.completed = !this.completed;
  }

  update(text, date) {
    this.text = text;
    this.date = date;
  }

  toJSON() {
    return {
      text: this.text,
      date: this.date,
      completed: this.completed
    };
  }

  static fromJSON(json) {
    return new Task(json.text, json.date, json.completed);
  }
}

// ============================================================================
// 4. TASK MANAGER - Управление задачами
// ============================================================================
class TaskManager {
  constructor(storageService) {
    this.storage = storageService;
    this.tasks = { day: [], week: [], month: [] };
  }

  async loadTasks() {
    const data = await this.storage.loadTasks();
    // Преобразуем JSON в объекты Task
    this.tasks.day = data.day.map(t => Task.fromJSON(t));
    this.tasks.week = data.week.map(t => Task.fromJSON(t));
    this.tasks.month = data.month.map(t => Task.fromJSON(t));
  }

  async saveTasks() {
    // Преобразуем объекты Task в JSON
    const data = {
      day: this.tasks.day.map(t => t.toJSON()),
      week: this.tasks.week.map(t => t.toJSON()),
      month: this.tasks.month.map(t => t.toJSON())
    };
    return await this.storage.saveTasks(data);
  }

  getTasks(period) {
    return this.tasks[period] || [];
  }

  getSortedTasks(period) {
    return [...this.getTasks(period)].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });
  }

  addTask(period, text, date = null) {
    const task = new Task(text, date);
    this.tasks[period].push(task);
    return this.saveTasks();
  }

  updateTask(period, index, text, date) {
    if (this.tasks[period][index]) {
      this.tasks[period][index].update(text, date);
      return this.saveTasks();
    }
  }

  removeTask(period, index) {
    if (this.tasks[period][index]) {
      this.tasks[period].splice(index, 1);
      return this.saveTasks();
    }
  }

  toggleTask(period, index) {
    if (this.tasks[period][index]) {
      this.tasks[period][index].toggle();
      return this.saveTasks();
    }
  }
}

// ============================================================================
// 5. DATE FORMATTER - Форматирование дат
// ============================================================================
class DateFormatter {
  constructor(translationService) {
    this.translationService = translationService;
  }

  format(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const lang = this.translationService.getLanguage();
    return date.toLocaleDateString(lang, options);
  }
}

// ============================================================================
// 6. TASK RENDERER - Отрисовка задач
// ============================================================================
class TaskRenderer {
  constructor(taskManager, dateFormatter, translationService) {
    this.taskManager = taskManager;
    this.dateFormatter = dateFormatter;
    this.translationService = translationService;
  }

  render(period, onToggle, onEdit, onDelete) {
    const container = document.getElementById(`${period}-tasks`);
    if (!container) return;

    container.innerHTML = '';
    const sortedTasks = this.taskManager.getSortedTasks(period);
    const allTasks = this.taskManager.getTasks(period);
    
    sortedTasks.forEach(task => {
      const originalIndex = allTasks.indexOf(task);
      const taskElement = this.createTaskElement(
        task, 
        period, 
        originalIndex,
        onToggle,
        onEdit,
        onDelete
      );
      container.appendChild(taskElement);
    });
  }

  createTaskElement(task, period, index, onToggle, onEdit, onDelete) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    
    // Чекбокс
    const checkbox = this.createCheckbox(task, () => onToggle(period, index));
    
    // Текст и дата
    const textContainer = this.createTextContainer(task);
    
    // Кнопки действий
    const editBtn = this.createButton('✏️', 'btn-edit', () => onEdit(period, index));
    const deleteBtn = this.createButton('🗑️', 'btn-delete', () => onDelete(period, index));
    
    taskDiv.appendChild(checkbox);
    taskDiv.appendChild(textContainer);
    taskDiv.appendChild(editBtn);
    taskDiv.appendChild(deleteBtn);
    
    return taskDiv;
  }

  createCheckbox(task, onChange) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', onChange);
    return checkbox;
  }

  createTextContainer(task) {
    const container = document.createElement('div');
    container.className = 'task-text-container';
    
    const text = document.createElement('span');
    text.textContent = task.text;
    text.className = task.completed ? 'completed' : '';
    container.appendChild(text);
    
    if (task.date) {
      const dateSpan = document.createElement('span');
      dateSpan.className = 'task-date';
      dateSpan.textContent = this.dateFormatter.format(task.date);
      container.appendChild(dateSpan);
    }
    
    return container;
  }

  createButton(text, className, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', onClick);
    return button;
  }
}

// ============================================================================
// 7. MODAL CONTROLLER - Управление модальным окном
// ============================================================================
class ModalController {
  constructor(translationService) {
    this.translationService = translationService;
    this.modal = document.getElementById('modal');
    this.modalTitle = document.getElementById('modal-title');
    this.taskInput = document.getElementById('task-input');
    this.taskDate = document.getElementById('task-date');
    this.modalSave = document.getElementById('modal-save');
    this.modalCancel = document.getElementById('modal-cancel');
    this.onSaveCallback = null;
    this.currentPeriod = '';
    this.editingIndex = -1;
  }

  open(period, index = -1, task = null) {
    this.currentPeriod = period;
    this.editingIndex = index;
    
    const isEditing = index !== -1;
    this.modalTitle.textContent = this.translationService.translate(
      isEditing ? 'edit_task' : 'add_task'
    );
    
    this.taskInput.value = task ? task.text : '';
    this.taskDate.value = task?.date || '';
    this.modal.style.display = 'flex';
    this.taskInput.focus();
  }

  close() {
    this.modal.style.display = 'none';
    this.taskInput.value = '';
    this.taskDate.value = '';
    this.currentPeriod = '';
    this.editingIndex = -1;
  }

  onSave(callback) {
    this.onSaveCallback = callback;
  }

  getTaskData() {
    return {
      text: this.taskInput.value.trim(),
      date: this.taskDate.value || null,
      period: this.currentPeriod,
      index: this.editingIndex
    };
  }

  validate() {
    const text = this.taskInput.value.trim();
    if (!text) {
      alert(this.translationService.translate('empty_task'));
      return false;
    }
    return true;
  }

  setupEventListeners() {
    this.modalSave.addEventListener('click', () => {
      if (this.validate() && this.onSaveCallback) {
        this.onSaveCallback(this.getTaskData());
      }
    });

    this.modalCancel.addEventListener('click', () => this.close());

    this.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.validate() && this.onSaveCallback) {
        this.onSaveCallback(this.getTaskData());
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'flex') {
        this.close();
      }
    });
  }
}

// ============================================================================
// 8. UI CONTROLLER - Управление интерфейсом
// ============================================================================
class UIController {
  constructor(translationService) {
    this.translationService = translationService;
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        contents.forEach(c => c.style.display = 'none');
        const targetId = tab.dataset.tab;
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.style.display = 'block';
        }
      });
    });
  }

  setupLanguageButtons(onLanguageChange) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        onLanguageChange(btn.dataset.lang);
        this.updateActiveLanguageButton(btn.dataset.lang);
      });
    });
  }

  updateActiveLanguageButton(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  setupAddButtons(onAdd) {
    ['day', 'week', 'month'].forEach(period => {
      const btn = document.getElementById(`${period}-add`);
      if (btn) {
        btn.addEventListener('click', () => onAdd(period));
      }
    });
  }

  setupExitButton(onExit) {
    const exitBtn = document.getElementById('exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', onExit);
    }
  }
}

// ============================================================================
// 9. APP CONTROLLER - Главный контроллер приложения
// ============================================================================
class AppController {
  constructor() {
    // Инициализация сервисов
    this.storageService = new StorageService();
    this.translationService = new TranslationService();
    this.taskManager = new TaskManager(this.storageService);
    this.dateFormatter = new DateFormatter(this.translationService);
    this.taskRenderer = new TaskRenderer(
      this.taskManager, 
      this.dateFormatter, 
      this.translationService
    );
    this.modalController = new ModalController(this.translationService);
    this.uiController = new UIController(this.translationService);
  }

  async init() {
    // Загрузка языка
    const savedLang = this.storageService.getLanguage();
    this.setLanguage(savedLang);
    
    // Загрузка задач
    await this.taskManager.loadTasks();
    this.renderAllTasks();
    
    // Настройка UI
    this.setupUI();
  }

  setupUI() {
    this.uiController.setupTabs();
    this.uiController.setupLanguageButtons((lang) => this.setLanguage(lang));
    this.uiController.setupAddButtons((period) => this.openAddModal(period));
    this.uiController.setupExitButton(() => this.exitApp());
    
    this.modalController.setupEventListeners();
    this.modalController.onSave((data) => this.saveTask(data));
  }

  setLanguage(lang) {
    this.translationService.setLanguage(lang);
    this.storageService.setLanguage(lang);
    this.translationService.applyTranslations();
    this.uiController.updateActiveLanguageButton(lang);
    this.renderAllTasks(); // Перерендер для обновления дат
  }

  renderAllTasks() {
    ['day', 'week', 'month'].forEach(period => {
      this.taskRenderer.render(
        period,
        (p, i) => this.toggleTask(p, i),
        (p, i) => this.openEditModal(p, i),
        (p, i) => this.removeTask(p, i)
      );
    });
  }

  openAddModal(period) {
    this.modalController.open(period);
  }

  openEditModal(period, index) {
    const task = this.taskManager.getTasks(period)[index];
    this.modalController.open(period, index, task);
  }

  async saveTask(data) {
    const { text, date, period, index } = data;
    
    if (index === -1) {
      await this.taskManager.addTask(period, text, date);
    } else {
      await this.taskManager.updateTask(period, index, text, date);
    }
    
    this.taskRenderer.render(
      period,
      (p, i) => this.toggleTask(p, i),
      (p, i) => this.openEditModal(p, i),
      (p, i) => this.removeTask(p, i)
    );
    this.modalController.close();
  }

  async toggleTask(period, index) {
    await this.taskManager.toggleTask(period, index);
    this.taskRenderer.render(
      period,
      (p, i) => this.toggleTask(p, i),
      (p, i) => this.openEditModal(p, i),
      (p, i) => this.removeTask(p, i)
    );
  }

  async removeTask(period, index) {
    if (confirm(this.translationService.translate('confirm_delete'))) {
      await this.taskManager.removeTask(period, index);
      this.taskRenderer.render(
        period,
        (p, i) => this.toggleTask(p, i),
        (p, i) => this.openEditModal(p, i),
        (p, i) => this.removeTask(p, i)
      );
    }
  }

  async exitApp() {
    if (confirm(this.translationService.translate('confirm_exit'))) {
      await this.storageService.exitApp();
    }
  }
}

// ============================================================================
// 10. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});