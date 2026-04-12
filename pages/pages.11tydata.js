/**
 * Eleventy directory data for pages/.
 * Strips the "/pages" segment from output URLs so all pages
 * appear at clean root-level paths, e.g. /rolunk/ instead of /pages/rolunk/.
 */
module.exports = {
    eleventyComputed: {
        permalink: function (data) {
            // page.filePathStem = "/pages/rolunk/index"
            const clean = data.page.filePathStem
                .replace(/^\/pages/, '')
                .replace(/\/index$/, '');
            return clean + '/';
        },
        canonical: function (data) {
            const clean = data.page.filePathStem
                .replace(/^\/pages/, '')
                .replace(/\/index$/, '');
            return 'https://bagolykaland.hu' + clean + '/';
        },
    },
};
