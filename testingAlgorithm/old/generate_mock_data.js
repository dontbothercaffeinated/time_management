const fs = require('fs');

// Generate a random due date between 1 week and 6 months from today
function generateRandomDueDate() {
  const now = new Date();
  const minDate = now.getTime() + 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
  const maxDate = now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000; // 6 months (approx.) in milliseconds
  const randomDate = Math.random() * (maxDate - minDate) + minDate;
  return Math.floor(randomDate / 1000); // Unix timestamp in seconds
}

// Generate 1000 assignments with 20 unique courses and 50 unique assignment names per course
function generateMockData() {
  const totalAssignments = 1000;
  const totalCourses = 20;
  const assignmentsPerCourse = 50; // Each course has 50 unique assignments

  const baseCourseNames = [
    "Accounting", "Math", "History", "Biology", "Chemistry", "Physics", 
    "English", "Computer Science", "Philosophy", "Art", "Economics", 
    "Psychology", "Sociology", "Political Science", "Statistics", 
    "Marketing", "Finance", "Management", "Nursing", "Engineering"
  ];

  const courses = baseCourseNames.slice(0, totalCourses); // Limit to 20 courses
  const assignments = [];
  let assignmentId = 1;

  courses.forEach((course, courseIndex) => {
    for (let i = 1; i <= assignmentsPerCourse; i++) {
      if (assignmentId > totalAssignments) break; // Ensure no more than 1000 assignments

      const assignmentName = `Assignment ${i}`;
      const workedSeconds = Math.floor(Math.random() * (24 * 60 * 60)); // Random worked time between 0 and 24 hours

      assignments.push({
        id: assignmentId++,
        course: `${course} ${courseIndex + 1}`, // Add unique identifier to course name
        name: assignmentName,
        dueDate: generateRandomDueDate(),
        workedSeconds
      });
    }
  });

  return assignments;
}

// Calculate statistics for courses and assignments
function calculateStats(assignments) {
  const courseAssignmentCounts = {};
  assignments.forEach((assignment) => {
    courseAssignmentCounts[assignment.course] = (courseAssignmentCounts[assignment.course] || 0) + 1;
  });

  const uniqueCourses = Object.keys(courseAssignmentCounts).length;
  const assignmentStats = Object.values(courseAssignmentCounts);

  return {
    uniqueCourses,
    assignmentStats,
    totalAssignments: assignments.length
  };
}

// Write mock data to test_data.json
function writeTestDataToFile() {
  const mockData = generateMockData();
  fs.writeFileSync('test_data.json', JSON.stringify(mockData, null, 2), 'utf-8');
  console.log(`Mock data for ${mockData.length} assignments generated and saved to test_data.json`);

  // Calculate and log statistics
  const stats = calculateStats(mockData);
  console.log(`Number of unique courses: ${stats.uniqueCourses}`);
  console.log(`Number of unique assignments per course:`, stats.assignmentStats);
  console.log(`Total assignments added to the database: ${stats.totalAssignments}`);
}

// Run the data generation
writeTestDataToFile();