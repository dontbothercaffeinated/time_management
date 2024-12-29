// user variables for the algorithm file
module.exports = {
    k: 1, // User-defined exponential weighting factor (preset: 1)
    minimumTmax: 864000, // minimum tMax value (preset: 864000 ie. 10 days)
    priorityAmplificationFactor: 1.2 // Controls amplification of priority differences // needs to be greater than 1 // the bigger you make it the smaller the amplification will be of priority assignments over ones with less priority // if you change this, test with multiple different assignments.json cases
};