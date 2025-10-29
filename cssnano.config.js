module.exports = {
    preset: [
        'advanced',
        {
            discardComments: {
                removeAll: true
            },
            autoprefixer: {
                add: true,
                browsers: ['last 2 versions', '> 1%', 'not dead']
            },
            reduceIdents: false,
            zindex: false,
            mergeIdents: false,
            discardUnused: {
                keyframes: true,
                fontFace: true
            },
            normalizeUrl: false,
            colormin: true,
            minifyFontValues: true,
            minifySelectors: true,
            calc: {
                precision: 5
            }
        }
    ]
};



