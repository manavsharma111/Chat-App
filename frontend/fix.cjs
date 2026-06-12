const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/pages/chats/ChatWindow.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix the import
content = content.replace("Trash2 } from 'lucide-react'", "Trash2, Lock } from 'lucide-react'");

// 2. Fix the commented block
const lines = content.split('\n');
const newLines = [];
let inTempBlock = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('  // ')) {
        newLines.push(line.substring(5));
    } else if (line.trim() === '//' || line === '  //\r' || line === '  //') {
        newLines.push('');
    } else if (line.startsWith('  //')) {
        newLines.push(line.substring(4));
    } else if (line.startsWith('  <div className="flex-1 h-screen w-full flex flex-col ">')) {
        inTempBlock = true;
    }

    if (inTempBlock) {
        if (line.startsWith('}')) {
            inTempBlock = false;
            newLines.push('}');
        }
    } else {
        if (!line.startsWith('  //')) {
            newLines.push(line);
        }
    }
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
console.log('Fix applied successfully');
