
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const message = document.getElementById("message");

const totalCount = document.getElementById("totalCount");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const footerCount = document.getElementById("footerCount");
const clearCompleted = document.getElementById("clearCompleted");
const submitBtn = document.getElementById("submitBtn");

let tasks = [];

try {
    const savedTasks = JSON.parse(
        localStorage.getItem("taskflow-tasks") || "[]"
    );

    if (Array.isArray(savedTasks)) {
        tasks = savedTasks.filter(task =>
            task &&
            typeof task.id === "number" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean"
        );
    }
} catch {
    tasks = [];
}

let currentFilter = "all";
let editingId = null;
let messageTimer;

function saveTasks() {
    try {
        localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
    } catch {
        showMessage("Could not save tasks in this browser.", true);
    }
}

function showMessage(text, isError = false) {
    clearTimeout(messageTimer);
    message.textContent = text;
    message.style.color = isError ? "#fca5a5" : "#6ee7b7";

    messageTimer = setTimeout(() => {
        message.textContent = "";
    }, 3000);
}

// Add a new task
taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        showMessage("Please enter a task first.", true);
        return;
    }

    if (editingId !== null) {
        tasks = tasks.map(task =>
            task.id === editingId ? { ...task, text } : task
        );

        editingId = null;
        submitBtn.textContent = "+ Add Task";
        showMessage("Task updated successfully!");
    } else {
        tasks.unshift({
            id: Date.now(),
            text: text,
            completed: false
        });

        showMessage("New task added successfully!");
    }

    taskInput.value = "";
    saveTasks();
    renderTasks();
    taskInput.focus();
});

// Show tasks and update statistics
function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    visibleTasks.forEach(task => {
        const li = document.createElement("li");
        li.className = "task-item";
        li.dataset.id = task.id;

        if (task.completed) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.text} as completed`
        );

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editBtn = document.createElement("button");
        editBtn.className = "action-btn edit-btn";
        editBtn.type = "button";
        editBtn.textContent = "✎";
        editBtn.title = "Edit task";
        editBtn.setAttribute("aria-label", "Edit task");

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "action-btn delete-btn";
        deleteBtn.type = "button";
        deleteBtn.textContent = "×";
        deleteBtn.title = "Delete task";
        deleteBtn.setAttribute("aria-label", "Delete task");

        actions.append(editBtn, deleteBtn);
        li.append(checkbox, text, actions);
        taskList.appendChild(li);
    });

    updateStats();

    emptyState.style.display = visibleTasks.length ? "none" : "block";

    if (visibleTasks.length === 0) {
        if (currentFilter === "active" && tasks.length > 0) {
            document.getElementById("emptyTitle").textContent =
                "All caught up!";
            document.getElementById("emptyText").textContent =
                "You have no active tasks.";
        } else if (currentFilter === "completed") {
            document.getElementById("emptyTitle").textContent =
                "Nothing completed yet";
            document.getElementById("emptyText").textContent =
                "Finish a task and it will appear here.";
        } else {
            document.getElementById("emptyTitle").textContent =
                "Your space is clear!";
            document.getElementById("emptyText").textContent =
                "Add your first task to get started.";
        }
    }
}

// Update counters and progress bar
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;
    const progress = total ? Math.round(completed / total * 100) : 0;

    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
    progressText.textContent = progress + "%";
    progressFill.style.width = progress + "%";

    footerCount.textContent =
        `${active} ${active === 1 ? "task" : "tasks"} left`;

    clearCompleted.disabled = completed === 0;
    clearCompleted.style.opacity = completed === 0 ? "0.45" : "1";
}

// Complete, edit or delete a task
taskList.addEventListener("click", function (event) {
    const li = event.target.closest(".task-item");
    if (!li) return;

    const id = Number(li.dataset.id);
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    if (event.target.matches(".task-check")) {
        task.completed = event.target.checked;
        saveTasks();
        renderTasks();
    }

    if (event.target.matches(".edit-btn")) {
        if (task.completed) {
            showMessage("Uncheck the task before editing it.", true);
            return;
        }

        editingId = id;
        taskInput.value = task.text;
        submitBtn.textContent = "Save Changes";
        taskInput.focus();
        taskInput.select();
        showMessage("Edit your task and click Save Changes.");
    }

    if (event.target.matches(".delete-btn")) {
        if (!confirm("Are you sure you want to delete this task?")) {
            return;
        }

        tasks = tasks.filter(item => item.id !== id);

        if (editingId === id) {
            editingId = null;
            taskInput.value = "";
            submitBtn.textContent = "+ Add Task";
        }

        saveTasks();
        renderTasks();
        showMessage("Task deleted.");
    }
});

// Filter: All, Active and Completed
document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;

        document.querySelectorAll(".filter").forEach(filter => {
            filter.classList.toggle("active", filter === button);
        });

        renderTasks();
    });
});

// Delete all completed tasks
clearCompleted.addEventListener("click", function () {
    const completed = tasks.filter(task => task.completed).length;

    if (!completed) return;

    if (!confirm(`Delete all ${completed} completed task(s)?`)) {
        return;
    }

    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
    showMessage("Completed tasks cleared.");
});

// Initial display
renderTasks();
