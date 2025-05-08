const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  
  try {
    // List files in the current directory
    const files = fs.readdirSync('.');
    const dirs = files.filter(file => fs.statSync(file).isDirectory());
    
    // Get process info
    const cwd = process.cwd();
    const env = JSON.stringify(process.env, null, 2);
    
    let output = `
      <h1>Debug Info</h1>
      <h2>Current Working Directory:</h2>
      <pre>${cwd}</pre>
      
      <h2>Directories:</h2>
      <ul>
        ${dirs.map(dir => `<li>${dir}</li>`).join('')}
      </ul>
      
      <h2>All Files:</h2>
      <ul>
        ${files.map(file => `<li>${file}</li>`).join('')}
      </ul>
    `;
    
    res.end(output);
  } catch (error) {
    res.end(`<h1>Error</h1><pre>${error.stack}</pre>`);
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 