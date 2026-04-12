/**
 * Eleventy directory data for pages/.
 * Output stays inside pages/ in the repo (e.g. pages/rolunk/index.html).
 * .htaccess rewrites /rolunk/ → /pages/rolunk/ so public URLs stay clean.
 */
module.exports = {
    eleventyComputed: {
        permalink: function (data) {
            // page.filePathStem = "/pages/rolunk/index"
            const clean = data.page.filePathStem
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
