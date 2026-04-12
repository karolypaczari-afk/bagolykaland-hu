module.exports = function (eleventyConfig) {
    eleventyConfig.addGlobalData('currentYear', () => new Date().getFullYear());

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
