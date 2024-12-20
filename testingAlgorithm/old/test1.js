const cas = require('cas.js');

try {
    console.log('Testing CAS.js Function:');
    const result = cas('x + y'); // Try a simple symbolic expression
    console.log('Result of CAS.js function call:', result);
} catch (error) {
    console.error('Error:', error.message);
}