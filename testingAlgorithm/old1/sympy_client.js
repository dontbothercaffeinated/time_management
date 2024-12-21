const { spawn } = require('child_process');
const fs = require('fs'); // File operations
const config = require('./config'); // System variables
const lastrun = require('./lastrun'); // Last run timestamp
const cliProgress = require('cli-progress'); // Progress bar

// Helper function to run a Python script
function runPythonScript(script, inputData) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [script]);

        let result = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    resolve(JSON.parse(result));
                } catch (err) {
                    reject('Error parsing Python output: ' + err.message);
                }
            } else {
                reject('Python process exited with code ' + code + ': ' + error);
            }
        });

        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();
    });
}

// Helper function to append results to a JSON file
function appendToJSONFile(filePath, key, value) {
    let data = {};
    if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    data[key] = value;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

// Main function
async function main() {
    // Read assignments from the database
    const rawData = fs.readFileSync('./test_data.json', 'utf8');
    const assignments = JSON.parse(rawData);

    // Precompute global stats
    const meanDueDate = calculateMeanForKey(assignments, "dueDate");
    const standardDeviationDueDates = calculateStandardDeviationForKey(assignments, "dueDate", meanDueDate);
    const meanWorkedSeconds = calculateMeanForKey(assignments, "workedSeconds");
    const standardDeviationWorkedSeconds = calculateStandardDeviationForKey(assignments, "workedSeconds", meanWorkedSeconds);

    // File paths for intermediate and final results
    const numeratorsFile = './numerators.json';
    const denominatorFile = './denominator.json';
    const timeSharesFile = './time_shares.json';

    // Step 1: Calculate and Store Numerators for Each Assignment
    console.log('Calculating numerators for each assignment...');
    const numeratorBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    numeratorBar.start(assignments.length, 0);

    for (const [index, assignment] of assignments.entries()) {
        const params = {
            t1: getCurrentUnixTime(),
            D: assignment.dueDate,
            muDueTimes: meanDueDate,
            sigmaDueTimes: standardDeviationDueDates,
            muLoggedTimes: meanWorkedSeconds,
            sigmaLoggedTimes: standardDeviationWorkedSeconds,
            loggedTime: assignment.workedSeconds,
            t0: lastrun.t0, // Last run time
            ...config,
        };

        try {
            const result = await runPythonScript('compute_numerators.py', params);
            appendToJSONFile(numeratorsFile, assignment.id, result.numerator); // Store locally
            numeratorBar.update(index + 1); // Update progress bar
        } catch (error) {
            console.error(`Error calculating numerator for assignment ID ${assignment.id}:`, error);
        }
    }
    numeratorBar.stop();
    console.log(`Numerators stored in ${numeratorsFile}`);

    // Step 2: Calculate the Denominator
    console.log('Calculating the denominator...');
    const denominatorBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    denominatorBar.start(1, 0);

    try {
        const numerators = JSON.parse(fs.readFileSync(numeratorsFile, 'utf8'));
        const denominatorResult = await runPythonScript('compute_denominator.py', { numerators });
        fs.writeFileSync(denominatorFile, JSON.stringify(denominatorResult, null, 4)); // Store locally
        denominatorBar.update(1); // Update progress bar
        console.log(`Denominator stored in ${denominatorFile}`);
    } catch (error) {
        console.error('Error calculating the denominator:', error);
    }
    denominatorBar.stop();

    // Step 3: Calculate and Store Proportional Time Contributions
    console.log('Calculating proportional time contributions...');
    const denominatorData = JSON.parse(fs.readFileSync(denominatorFile, 'utf8'));
    const denominator = denominatorData.denominator;

    for (const assignment of assignments) {
        try {
            const numerator = JSON.parse(fs.readFileSync(numeratorsFile, 'utf8'))[assignment.id];
            const params = {
                numerator: numerator,
                denominator: denominator,
                delta_t: (getCurrentUnixTime() - lastrun.t0) / 3600,
            };

            const result = await runPythonScript('compute_time_shares.py', params);
            appendToJSONFile(timeSharesFile, assignment.id, result); // Store locally
            console.log(`Time share for assignment ID ${assignment.id} stored.`);
        } catch (error) {
            console.error(`Error calculating time share for assignment ID ${assignment.id}:`, error);
        }
    }

    console.log(`Proportional time contributions stored in ${timeSharesFile}`);
}

// Utility functions
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

// Run the main function
main().catch((err) => console.error(err));