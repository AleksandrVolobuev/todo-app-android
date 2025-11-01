// Storage класс для работы с данными
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

  async exitApp() {
    // Проверяем, запущено ли приложение через Capacitor
    if (window.Capacitor && window.Capacitor.Plugins.App) {
      await window.Capacitor.Plugins.App.exitApp();
    } else {
      window.close();
    }
  }
}

const storage = new Storage();

// Переводы
const translations = {
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

// Текущий язык
let currentLang = 'uk';

// Функция перевода
function t(key) {
  return translations[currentLang][key] || key;
}

// Применить переводы ко всем элементам
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  
  document.documentElement.lang = currentLang;
}

// Сменить язык
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  applyTranslations();
  
  // Обновить активную кнопку языка
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// Глобальные переменные
let tasks = { day: [], week: [], month: [] };
let currentPeriod = '';
let editingIndex = -1;

// Элементы DOM
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const taskInput = document.getElementById('task-input');
const taskDate = document.getElementById('task-date');
const modalSave = document.getElementById('modal-save');
const modalCancel = document.getElementById('modal-cancel');

// Загрузка задач при старте
async function loadTasks() {
  try {
    const loadedTasks = await storage.loadTasks();
    tasks = loadedTasks;
    renderTasks('day');
    renderTasks('week');
    renderTasks('month');
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
}

// Сохранение задач
async function saveTasks() {
  try {
    await storage.saveTasks(tasks);
  } catch (error) {
    console.error('Ошибка сохранения:', error);
  }
}

// Форматирование даты
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString(currentLang, options);
}

// Рендер списка задач
function renderTasks(period) {
  const container = document.getElementById(`${period}-tasks`);
  if (!container) return;

  container.innerHTML = '';
  
  // Сортировка по дате
  const sortedTasks = [...tasks[period]].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });
  
  sortedTasks.forEach((task, index) => {
    const originalIndex = tasks[period].indexOf(task);
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    
    // Чекбокс
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed || false;
    checkbox.addEventListener('change', () => toggleTask(period, originalIndex));
    
    // Контейнер для текста и даты
    const textContainer = document.createElement('div');
    textContainer.className = 'task-text-container';
    
    const text = document.createElement('span');
    text.textContent = task.text;
    text.className = task.completed ? 'completed' : '';
    
    textContainer.appendChild(text);
    
    // Дата
    if (task.date) {
      const dateSpan = document.createElement('span');
      dateSpan.className = 'task-date';
      dateSpan.textContent = formatDate(task.date);
      textContainer.appendChild(dateSpan);
    }
    
    // Кнопки
    const btnEdit = document.createElement('button');
    btnEdit.textContent = '✏️';
    btnEdit.className = 'btn-edit';
    btnEdit.addEventListener('click', () => editTask(period, originalIndex));
    
    const btnDelete = document.createElement('button');
    btnDelete.textContent = '🗑️';
    btnDelete.className = 'btn-delete';
    btnDelete.addEventListener('click', () => removeTask(period, originalIndex));
    
    taskDiv.appendChild(checkbox);
    taskDiv.appendChild(textContainer);
    taskDiv.appendChild(btnEdit);
    taskDiv.appendChild(btnDelete);
    
    container.appendChild(taskDiv);
  });
}

// Открыть модальное окно для добавления
function addTask(period) {
  currentPeriod = period;
  editingIndex = -1;
  modalTitle.textContent = t('add_task');
  taskInput.value = '';
  taskDate.value = '';
  modal.style.display = 'flex';
  taskInput.focus();
}

// Открыть модальное окно для редактирования
function editTask(period, index) {
  currentPeriod = period;
  editingIndex = index;
  modalTitle.textContent = t('edit_task');
  taskInput.value = tasks[period][index].text;
  taskDate.value = tasks[period][index].date || '';
  modal.style.display = 'flex';
  taskInput.focus();
}

// Удалить задачу
function removeTask(period, index) {
  if (confirm(t('confirm_delete'))) {
    tasks[period].splice(index, 1);
    renderTasks(period);
    saveTasks();
  }
}

// Переключить статус выполнения
function toggleTask(period, index) {
  tasks[period][index].completed = !tasks[period][index].completed;
  renderTasks(period);
  saveTasks();
}

// Сохранить задачу (добавить или редактировать)
function saveTask() {
  const text = taskInput.value.trim();
  if (!text) {
    alert(t('empty_task'));
    return;
  }
  
  const taskData = {
    text,
    completed: false,
    date: taskDate.value || null
  };
  
  if (editingIndex === -1) {
    // Добавить новую
    tasks[currentPeriod].push(taskData);
  } else {
    // Редактировать существующую
    tasks[currentPeriod][editingIndex].text = text;
    tasks[currentPeriod][editingIndex].date = taskDate.value || null;
  }
  
  renderTasks(currentPeriod);
  saveTasks();
  closeModal();
}

// Закрыть модальное окно
function closeModal() {
  modal.style.display = 'none';
  taskInput.value = '';
  taskDate.value = '';
  currentPeriod = '';
  editingIndex = -1;
}

// Выход из приложения
async function exitApp() {
  if (confirm(t('confirm_exit'))) {
    await storage.exitApp();
  }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  // Загрузить язык из localStorage
  const savedLang = localStorage.getItem('language') || 'uk';
  setLanguage(savedLang);
  
  // Переключение вкладок
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

  // Переключение языков
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
    });
  });

  // Кнопка выхода
  document.getElementById('exit-btn').addEventListener('click', exitApp);

  // Кнопки добавления
  document.getElementById('day-add').addEventListener('click', () => addTask('day'));
  document.getElementById('week-add').addEventListener('click', () => addTask('week'));
  document.getElementById('month-add').addEventListener('click', () => addTask('month'));

  // Модальное окно
  modalSave.addEventListener('click', saveTask);
  modalCancel.addEventListener('click', closeModal);
  
  // Закрытие по Enter
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveTask();
    }
  });

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });

  // Загрузить задачи
  loadTasks();
});