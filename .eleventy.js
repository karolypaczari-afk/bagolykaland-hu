const fs = require('fs');
const path = require('path');

function deleteHtmlInDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            deleteHtmlInDir(full);
        } else if (entry.name === 'index.html') {
            fs.unlinkSync(full);
        }
    }
}

module.exports = function (eleventyConfig) {
    eleventyConfig.addGlobalData('currentYear', () => new Date().getFullYear());

    // After each build, remove stale .html files from pages/ source directory.
    // Pages are output at clean root-level URLs via permalink in pages.11tydata.js.
    eleventyConfig.on('afterBuild', () => {
        deleteHtmlInDir(path.join(__dirname, 'pages'));
    });

    return {
        dir: {
            input: '.',
            output: '.',
            includes: '_includes',
            layouts: '_includes/layouts',
            data: '_data',
        },
        templateFormats: ['njk'],
    };
};
