// Import the required modules
const fs = require('fs');

// Function to calculate the mean of an array of numbers
function calculateMean(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

// Function to calculate the standard deviation of an array of numbers
function calculateStandardDeviation(values, mean) {
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const averageSquaredDifference = calculateMean(squaredDifferences);
  return Math.sqrt(averageSquaredDifference);
}

// Function to manually calculate z-scores for each assignment
function calculateManualZScores(assignments) {
  const workedSeconds = assignments.map(assignment => assignment.workedSeconds);
  
  const mean = calculateMean(workedSeconds);
  const standardDeviation = calculateStandardDeviation(workedSeconds, mean);

  // Log calculated mean and standard deviation for validation
  console.log('Calculated Mean:', mean);
  console.log('Calculated Standard Deviation:', standardDeviation);

  return assignments.map(assignment => {
    const zScore = (assignment.workedSeconds - mean) / standardDeviation;
    return {
      id: assignment.id,
      course: assignment.course,
      name: assignment.name,
      workedSeconds: assignment.workedSeconds,
      zScore: zScore.toFixed(2) // rounding to 2 decimal places
    };
  });
}

// Read the assignments JSON file
fs.readFile('../db/assignments.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Parse the JSON data
  const assignments = JSON.parse(data);

  // Calculate z-scores manually
  const assignmentsWithManualZScores = calculateManualZScores(assignments);

  // Log the assignments with their calculated z-scores
  console.log('Assignments with Manual Z-scores:', assignmentsWithManualZScores);
});