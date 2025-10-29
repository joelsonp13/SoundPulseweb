module.exports = {
    content: [
        './index.html',
        './js/**/*.js',
        './dist/**/*.html'
    ],
    css: ['./css/bundle.css'],
    output: './css/bundle.purged.css',
    
    // Classes dinâmicas que não devem ser removidas
    safelist: {
        standard: [
            /^music-card/,
            /^player/,
            /^sidebar/,
            /^modal/,
            /^toast/,
            /^loading/,
            /^skeleton/,
            /^carousel/,
            /^result-item/,
            /^search/,
            /^greeting/,
            /^fullscreen/,
            /^active$/,
            /^hidden$/,
            /^disabled$/,
            /^loaded$/
        ],
        deep: [
            /data-theme/,
            /^btn-/,
            /^icon-/
        ],
        greedy: [
            /^view-/,
            /^section-/
        ]
    },
    
    // Variáveis CSS que devem ser mantidas
    variables: true,
    
    // Keyframes que devem ser mantidos
    keyframes: true,
    
    // Fontes que devem ser mantidas
    fontFace: true,
    
    // Não remover espaços em branco (cssnano fará isso)
    rejected: false,
    rejectedCss: false
};


