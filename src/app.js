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
}

function updateCourseSelect() {
    const courseSelect = document.getElementById('course-select');
    courseSelect.innerHTML = '';
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
        li.innerHTML = `
            ${assignment.course} - ${assignment.name} - Due: ${new Date(
            assignment.dueDate
        ).toDateString()}
        `;
        assignmentsList.appendChild(li);
    });
}

document.getElementById('course-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const courseName = document.getElementById('course-name').value.trim();
    await window.electron.addCourse(courseName);
    fetchData();
});

document.getElementById('project-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const course = document.getElementById('course-select').value;
    const name = document.getElementById('assignment-name').value.trim();
    const dueDate = document.getElementById('due-date').value;
    await window.electron.addAssignment(course, name, dueDate);
    fetchData();
});

document.getElementById('filter-select').addEventListener('change', (event) => {
    const filter = event.target.value;
    updateAssignmentList(filter);
});

fetchData();