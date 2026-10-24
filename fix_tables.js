const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.jsx')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src', 'components', 'Dashboard'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // We can just replace 'truncate' with '' inside className attributes, but 
    // it's easier to just do a global replace for 'truncate' if it's inside className strings.
    // Let's use regex to find className="..." or className={\...\} on <td> tags
    // Or simpler: just replace 'truncate' globally if it's in a string that looks like a tailwind class list.
    // Actually, just replacing 'truncate' globally in JSX might hit something else, but it's probably safe.
    // But they want it on "hole system table", so all <td tags need 'text-center align-middle'.
    
    // Instead of regex, let's just do targeted replaces:
    let newContent = content.replace(/<td\s+([^>]*?)className=(["']|{\s*)(.*?)(["']|\s*})/g, (match, before, quote1, classes, quote2) => {
        let classList = classes.split(/\s+/);
        
        // Remove truncate and whitespace-nowrap and text-left and align-top
        classList = classList.filter(c => c !== 'truncate' && c !== 'text-left' && c !== 'text-right' && c !== 'align-top');
        
        // Add text-center and align-middle
        if (!classList.includes('text-center')) classList.push('text-center');
        if (!classList.includes('align-middle')) classList.push('align-middle');
        
        return <td className=;
    });

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated: ' + file);
        changed = true;
    }
});
