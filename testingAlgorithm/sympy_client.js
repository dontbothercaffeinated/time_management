const { spawn } = require('child_process');
const config = require('./config'); // Import system variables from config.js
const lastrun = require('./lastrun'); // Import t0 (last run) timestamp
const fs = require('fs'); // For reading the JSON file


function calculateProportionalTimeContribution(params) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['sympy_calculator.py']);

        let result = '';
        let error = '';

        // Capture stdout from the Python process
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        // Capture stderr from the Python process
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        // Handle process close
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const output = JSON.parse(result);
                    if (output.error) {
                        reject(output.error);
                    } else {
                        resolve(output);
                    }
                } catch (err) {
                    reject('Error parsing Python output: ' + err.message);
                }
            } else {
                reject('Python process exited with code ' + code + ': ' + error);
            }
        });

        // Combine input parameters with system variables
        const combinedParams = { ...params, ...config, ...lastrun };

        // Send the parameters to the Python process via stdin
        pythonProcess.stdin.write(JSON.stringify(combinedParams));
        pythonProcess.stdin.end();
    });
}

function getCurrentUnixTime() {
    return Math.floor(Date.now() / 1000); // Converts milliseconds to seconds
}

// Read the JSON file
const rawData = fs.readFileSync('./test_data.json', 'utf8');
// Parse the JSON data into an array of objects
const assignments = JSON.parse(rawData);
// Get the current Unix time once, before entering the loop
const currentUnixTime = getCurrentUnixTime(); 

// Function to calculate the mean of a specific key in the assignments
function calculateMeanForKey(assignments, key) {
    const values = assignments.map(assignment => assignment[key]);
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// Function to calculate the standard deviation of a specific key in the assignments
function calculateStandardDeviationForKey(assignments, key, mean) {
    const values = assignments.map(assignment => assignment[key]);

    // Calculate the squared differences from the mean
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));

    // Calculate the variance (mean of the squared differences)
    const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;

    // Return the square root of the variance (standard deviation)
    return Math.sqrt(variance);
}

// Calculate the mean due date once before the main run loop
const meanDueDate = calculateMeanForKey(assignments,"dueDate");

// Pass the precomputed mean to the standard deviation function
// Get standard deviation for due dates
const standardDeviationDueDates = calculateStandardDeviationForKey(assignments, meanDueDate,"dueDate");


// Calculate the mean worked seconds once before the main run loop
const meanWorkedSeconds = calculateMeanForKey(assignments,"workedSeconds");

// Pass the precomputed mean to the standard deviation function
// Get standard deviation for worked seconds
const standardDeviationWorkedSeconds = calculateStandardDeviationForKey(assignments, meanWorkedSeconds,"workedSeconds");





// Loop through each assignment and calculate the time contribution
// Main run loop
assignments.forEach((assignment) => {

    console.log("--------------------------")
    console.log(assignment.id)
    console.log(assignment.course)
    console.log(assignment.name)
    console.log(assignment.dueDate)
    console.log(assignment.workedSeconds)



    // Define input parameters with Unix timestamps
    const params = {
        t1: currentUnixTime, // Current unix time from before the loop started
        D: assignment.dueDate,  // Due date: 2023-10-15 15:00:00 UTC // of current assignment
        muDueTimes: meanDueDate,  // Mean of due dates in unix format
        sigmaDueTimes: standardDeviationDueDates, // Standard deviation of due dates in unix format
        muLoggedTimes: meanWorkedSeconds,  // Mean of logged times
        sigmaLoggedTimes: standardDeviationWorkedSeconds, // Standard deviation of logged times
        loggedTime: assignment.workedSeconds    // Logged time
    };

    // Call the Python script and display the results
    calculateProportionalTimeContribution(params)
        .then((result) => {
            console.log('Numerator (Symbolic):', result.numerator);
            console.log('Denominator (Symbolic):', result.denominator);
            console.log('Proportion (Symbolic):', result.symbolic_proportion);
            console.log('Proportion (Numeric):', result.numeric_proportion);
            console.log('Time Share:', result.time_share);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});