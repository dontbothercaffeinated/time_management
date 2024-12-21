const fs = require('fs');
const userVariables = require('./user_variables_algorithm'); // Import user-configurable variables specific for this algorithm file // variables that could be modified by an advanced user in ./user_variables_algorithm
const systemVariables = require('./system_variables_algorithm'); // Import system variables specific for this algorithm file // variables that should not be modified by any user (set programmatically)

function trapezoidalRule(t0, t1, params) {
    const {
        k,
        Tmax,
        D,
        muDueTimes,
        sigmaDueTimes,
        muLoggedTimes,
        sigmaLoggedTimes,
        loggedTime,
    } = params;

    const deltaT = 1; // Step size in seconds (Unix timestamp resolution)
    let sum = 0;

    for (let t = t0; t < t1; t += deltaT) {
        const f_t = priorityFunction(t, params);
        const f_tNext = priorityFunction(t + deltaT, params);

        // Trapezoidal rule formula
        sum += (f_t + f_tNext) / 2 * deltaT;
    }

    return sum;
}

function priorityFunction(t, params) {
    const {
        k,
        Tmax,
        D,
        muDueTimes,
        sigmaDueTimes,
        muLoggedTimes,
        sigmaLoggedTimes,
        loggedTime,
    } = params;

    // Exponential term
    const expTerm = (1 - Math.exp(-k * (Tmax - (D - t)) / Tmax)) / (1 - Math.exp(-k));

    // First term of priority function
    const firstTerm = (0.5 + 0.5 * expTerm) * ((D - t) - muDueTimes) / sigmaDueTimes;

    // Second term of priority function
    const secondTerm = (0.5 - 0.5 * expTerm) * (loggedTime - muLoggedTimes) / sigmaLoggedTimes;

    return firstTerm + secondTerm;
}

function calculateMeanForKey(assignments, key) {
    const values = assignments.map((assignment) => assignment[key]);
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStandardDeviationForKey(assignments, key, mean) {
    const values = assignments.map((assignment) => assignment[key]);
    const squaredDifferences = values.map((value) => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(variance);
}

function getCurrentUnixTime() {
    return Math.floor(Date.now() / 1000); // Converts milliseconds to seconds
}

// Calculate T_max
function calculateTmax(assignments,minTmax) {
    const currentTime = getCurrentUnixTime();

    // Calculate the total seconds until due date for each assignment
    const secondsUntilDue = assignments.map(assignment => assignment.dueDate - currentTime);

    // Calculate the mean of the total seconds until due date
    const meanSecondsUntilDue = secondsUntilDue.reduce((sum, value) => sum + value, 0) / secondsUntilDue.length;

    // Return the greater of 10 days or the mean of seconds until due date
    return Math.max(minTmax, meanSecondsUntilDue);
}

// Read assignments from the database
const rawData = fs.readFileSync('./test_data.json', 'utf8');
const assignments = JSON.parse(rawData);

const meanDueDate = calculateMeanForKey(assignments, "dueDate");
const standardDeviationDueDates = calculateStandardDeviationForKey(assignments, "dueDate", meanDueDate);
const meanWorkedSeconds = calculateMeanForKey(assignments, "workedSeconds");
const standardDeviationWorkedSeconds = calculateStandardDeviationForKey(assignments, "workedSeconds", meanWorkedSeconds);

// Compute Tmax
const tMaxVal = calculateTmax(assignments,userVariables.minimumTmax);

const currentTimeInUnix = getCurrentUnixTime();

const t0 = systemVariables.t0; // Unix timestamp for start time
const t1 = currentTimeInUnix; // Unix timestamp for end time

assignments.forEach((assignment) => {

    // Example Usage
    const params = {
        k: userVariables.k, // Exponential weighting factor
        Tmax: tMaxVal, // number of seconds away from due date where weight starts shifting towards time until due priority // used to make sure approaching due dates overpower time worked
        D: assignment.dueDate, // Due date in Unix timestamp
        muDueTimes: meanDueDate, // Mean of due dates
        sigmaDueTimes: standardDeviationDueDates, // Standard deviation of due dates
        muLoggedTimes: meanWorkedSeconds, // Mean logged time
        sigmaLoggedTimes: standardDeviationWorkedSeconds, // Standard deviation of logged time
        loggedTime: assignment.workedSeconds, // Logged time
    };

    const result = trapezoidalRule(t0, t1, params);
    console.log("Approximation of Integral:", result);

});