class TodoApp {
  constructor() {
    // State
    this.todos = this.loadTodos();
    this.filter = 'all'; // 'all' | 'active' | 'completed'

    // DOM Elements
    this.form = document.getElementById('todo-form');
    this.input = document.getElementById('todo-input');
    this.todoList = document.getElementById('todo-list');
    this.filterContainer = document.getElementById('filter-buttons');
    this.clearCompletedBtn = document.getElementById('clear-completed');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.emptyState = document.getElementById('empty-state');

    // Bind methods
    this.addTodo = this.addTodo.bind(this);
    this.handleTodoAction = this.handleTodoAction.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.clearCompleted = this.clearCompleted.bind(this);

    // Initialize
    this.init();
  }

  init() {
    // Event Listeners
    if (this.form) {
      this.form.addEventListener('submit', this.addTodo);
    }
    if (this.todoList) {
      this.todoList.addEventListener('click', this.handleTodoAction);
    }
    if (this.filterContainer) {
      this.filterContainer.addEventListener('click', this.handleFilterChange);
    }
    if (this.clearCompletedBtn) {
      this.clearCompletedBtn.addEventListener('click', this.clearCompleted);
    }

    // Initial Render
    this.render();
  }

  // --- State Management ---

  loadTodos() {
    try {
      const stored = localStorage.getItem('todo-app-tasks');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load todos from localStorage:', error);
      return [];
    }
  }

  saveTodos() {
    try {
      localStorage.setItem('todo-app-tasks', JSON.stringify(this.todos));
    } catch (error) {
      console.error('Failed to save todos to localStorage:', error);
    }
  }

  setState(updater) {
    updater();
    this.saveTodos();
    this.render();
  }

  // --- Actions ---

  addTodo(event) {
    event.preventDefault();
    if (!this.input) return;

    const text = this.input.value.trim();
    if (!text) return;

    const newTodo = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      text,
      completed: false,
      createdAt: Date.now()
    };

    this.setState(() => {
      this.todos.unshift(newTodo);
    });

    this.input.value = '';
    this.input.focus();
  }

  toggleTodo(id) {
    this.setState(() => {
      this.todos = this.todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
    });
  }

  deleteTodo(id) {
    const todoEl = this.todoList ? this.todoList.querySelector(`[data-id="${id}"]`) : null;
    if (todoEl) {
      todoEl.classList.add('removing');
      
      let transitionFired = false;
      const performDelete = () => {
        if (transitionFired) return;
        transitionFired = true;
        this.setState(() => {
          this.todos = this.todos.filter(todo => todo.id !== id);
        });
      };

      todoEl.addEventListener('transitionend', performDelete, { once: true });
      setTimeout(performDelete, 300); // Fallback matching CSS transition duration
    } else {
      this.setState(() => {
        this.todos = this.todos.filter(todo => todo.id !== id);
      });
    }
  }

  clearCompleted() {
    this.setState(() => {
      this.todos = this.todos.filter(todo => !todo.completed);
    });
  }

  handleTodoAction(event) {
    const target = event.target;
    const todoEl = target.closest('.todo-item');
    if (!todoEl) return;

    const id = todoEl.dataset.id;

    if (target.closest('.delete-btn')) {
      this.deleteTodo(id);
      return;
    }

    if (target.closest('.todo-checkbox') || target.closest('.todo-checkbox-label')) {
      this.toggleTodo(id);
    }
  }

  handleFilterChange(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const filter = button.dataset.filter;
    if (filter) {
      this.filter = filter;
      this.render();
    }
  }

  // --- Rendering ---

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getFilteredTodos() {
    switch (this.filter) {
      case 'active':
        return this.todos.filter(todo => !todo.completed);
      case 'completed':
        return this.todos.filter(todo => todo.completed);
      default:
        return this.todos;
    }
  }

  render() {
    const filtered = this.getFilteredTodos();

    // Render Todo List
    if (this.todoList) {
      this.todoList.innerHTML = '';

      if (filtered.length === 0) {
        if (this.emptyState) {
          this.emptyState.style.display = 'flex';
          const messageEl = this.emptyState.querySelector('.empty-message');
          if (messageEl) {
            if (this.filter === 'active') {
              messageEl.textContent = 'No active tasks. Time to relax!';
            } else if (this.filter === 'completed') {
              messageEl.textContent = 'No completed tasks yet. Keep going!';
            } else {
              messageEl.textContent = 'Your todo list is empty. Add a task to get started!';
            }
          }
        }
      } else {
        if (this.emptyState) {
          this.emptyState.style.display = 'none';
        }

        filtered.forEach(todo => {
          const li = document.createElement('li');
          li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
          li.dataset.id = todo.id;
          li.innerHTML = `
            <div class="todo-checkbox-wrapper">
              <input 
                type="checkbox" 
                id="check-${todo.id}" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''}
                aria-label="Mark task as completed"
              />
              <label for="check-${todo.id}" class="todo-checkbox-label"></label>
            </div>
            <span class="todo-text">${this.escapeHTML(todo.text)}</span>
            <button class="delete-btn" aria-label="Delete task">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          `;
          this.todoList.appendChild(li);
        });
      }
    }

    // Update Progress
    const totalCount = this.todos.length;
    const completedCount = this.todos.filter(todo => todo.completed).length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (this.progressFill) {
      this.progressFill.style.width = `${progressPercent}%`;
    }

    if (this.progressText) {
      this.progressText.textContent = `${completedCount} of ${totalCount} tasks completed (${progressPercent}%)`;
    }

    // Update Filter Buttons Active State
    if (this.filterContainer) {
      const buttons = this.filterContainer.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.dataset.filter === this.filter) {
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        }
      });
    }

    // Update Clear Completed Button Visibility
    if (this.clearCompletedBtn) {
      if (completedCount > 0) {
        this.clearCompletedBtn.style.display = 'inline-flex';
      } else {
        this.clearCompletedBtn.style.display = 'none';
      }
    }
  }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});