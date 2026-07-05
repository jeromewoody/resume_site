// validate-xml.js
const { exec } = require('child_process');
const path = require('path');

const xmlFile = path.join(__dirname, 'data', 'jerome_woody_resume.xml');
const dtdFile = path.join(__dirname, 'data', 'resume.dtd');

exec(`xmllint --noout --valid ${xmlFile}`, (error, stdout, stderr) => {
    if (error) {
        console.error('Validation Error:', stderr);
        process.exit(1);
    }
    console.log('XML is valid and well-formed');
});