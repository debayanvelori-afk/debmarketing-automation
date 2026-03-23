(function () {
  const STORAGE_KEY = 'simple-todo-tasks';

  // DOM elements
  const form = document.getElementById('todo-form');
  const taskInput = document.getElementById('task-input');
  const priorityInput = document.getElementById('priority-input');
  const labelInput = document.getElementById('label-input');
  const todoList = document.getElementById('todo-list');
  const emptyMsg = document.getElementById('empty-msg');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let tasks = loadTasks();
  let currentFilter = 'all';

  // --- Persistence ---
  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // --- Rendering ---
  function render() {
    todoList.innerHTML = '';

    const filtered = tasks.filter(function (t) {
      if (currentFilter === 'active') return !t.completed;
      if (currentFilter === 'completed') return t.completed;
      return true;
    });

    emptyMsg.classList.toggle('hidden', filtered.length > 0);

    filtered.forEach(function (task) {
      const li = document.createElement('li');
      li.className = 'todo-item' + (task.completed ? ' completed' : '');

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', function () {
        toggleTask(task.id);
      });

      // Content
      const content = document.createElement('div');
      content.className = 'todo-content';

      const text = document.createElement('div');
      text.className = 'todo-text';
      text.textContent = task.text;

      const meta = document.createElement('div');
      meta.className = 'todo-meta';

      // Priority badge
      const priorityBadge = document.createElement('span');
      priorityBadge.className = 'badge badge-priority-' + task.priority;
      priorityBadge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      meta.appendChild(priorityBadge);

      // Label badge
      if (task.label) {
        const labelBadge = document.createElement('span');
        labelBadge.className = 'badge badge-label';
        labelBadge.textContent = task.label;
        meta.appendChild(labelBadge);
      }

      // Completed date badge
      if (task.completedDate) {
        const dateBadge = document.createElement('span');
        dateBadge.className = 'badge badge-date';
        dateBadge.textContent = 'Done: ' + task.completedDate;
        meta.appendChild(dateBadge);
      }

      // Created date
      const createdBadge = document.createElement('span');
      createdBadge.className = 'badge';
      createdBadge.style.background = '#f5f5f5';
      createdBadge.style.color = '#888';
      createdBadge.textContent = 'Added: ' + task.createdDate;
      meta.appendChild(createdBadge);

      content.appendChild(text);
      content.appendChild(meta);

      // Delete button
      const actions = document.createElement('div');
      actions.className = 'todo-actions';
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = 'Delete task';
      deleteBtn.addEventListener('click', function () {
        deleteTask(task.id);
      });
      actions.appendChild(deleteBtn);

      li.appendChild(checkbox);
      li.appendChild(content);
      li.appendChild(actions);
      todoList.appendChild(li);
    });
  }

  // --- Actions ---
  function addTask(text, priority, label) {
    var now = new Date();
    tasks.unshift({
      id: Date.now().toString(),
      text: text,
      priority: priority,
      label: label,
      completed: false,
      completedDate: null,
      createdDate: formatDate(now)
    });
    saveTasks();
    render();
  }

  function toggleTask(id) {
    tasks = tasks.map(function (t) {
      if (t.id === id) {
        var nowCompleted = !t.completed;
        return Object.assign({}, t, {
          completed: nowCompleted,
          completedDate: nowCompleted ? formatDate(new Date()) : null
        });
      }
      return t;
    });
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) {
      return t.id !== id;
    });
    saveTasks();
    render();
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // --- Events ---
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = taskInput.value.trim();
    if (!text) return;
    addTask(text, priorityInput.value, labelInput.value.trim());
    taskInput.value = '';
    labelInput.value = '';
    priorityInput.value = 'medium';
    taskInput.focus();
  });

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // Initial render
  render();
})();
