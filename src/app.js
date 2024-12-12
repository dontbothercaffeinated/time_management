let courses = [];
let assignments = [];
let selectedAssignmentIndex = 0;

// Fetch data from the backend (filesystem)
async function fetchData() {
    const response = await window.electron.fetchData();
    courses = response.courses;
    assignments = response.assignments;
    updateUI();
}

function updateUI() {
    updateCourseSelect();
    updateFilterSelect();
    updateAssignmentList();
    resetAddAssignmentForm();
}

function updateCourseSelect() {
    const courseSelect = document.getElementById('course-select');
    courseSelect.innerHTML = '<option value="">Select a Course</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseSelect.appendChild(option);
    });
}

function updateFilterSelect() {
    const filterSelect = document.getElementById('filter-select');
    filterSelect.innerHTML = '<option value="all">All Courses</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        filterSelect.appendChild(option);
    });
}

function updateAssignmentList(filter = 'all') {
    const assignmentsList = document.getElementById('assignments');
    assignmentsList.innerHTML = '';
    const filteredAssignments = assignments.filter(
        a => filter === 'all' || a.course === filter
    );

    filteredAssignments.forEach((assignment, index) => {
        const li = document.createElement('li');
        li.classList.add('assignment-item');
        li.innerHTML = `
            <input type="radio" name="selected-assignment" class="select-task" onchange="selectTask(${index})" ${index === 0 ? 'checked' : ''}>
            <span>${assignment.course} - ${assignment.name} - Due: ${new Date(assignment.dueDate).toDateString()}</span>
        `;
        assignmentsList.appendChild(li);
    });

    if (filteredAssignments.length > 0) {
        selectTask(0); // Default to the first assignment
    }
}

function selectTask(index) {
    selectedAssignmentIndex = index;
}

async function handleAddCourse(event) {
    event.preventDefault();
    const courseName = document.getElementById('course-name').value.trim();
    if (courseName) {
        await window.electron.addCourse(courseName);
        fetchData();
    }
}

async function handleAddAssignment(event) {
    event.preventDefault();
    const course = document.getElementById('course-select').value;
    const name = document.getElementById('assignment-name').value.trim();
    const dueDate = document.getElementById('due-date').value;

    if (course && name && dueDate) {
        await window.electron.addAssignment(course, name, dueDate);
        fetchData();
    }
}

function resetAddAssignmentForm() {
    document.getElementById('course-select').value = '';
    document.getElementById('assignment-name').value = '';
    document.getElementById('due-date').value = '';
}

document.getElementById('course-form').addEventListener('submit', handleAddCourse);
document.getElementById('project-form').addEventListener('submit', handleAddAssignment);

document.getElementById('filter-select').addEventListener('change', (event) => {
    const filter = event.target.value;
    updateAssignmentList(filter);
});

fetchData();