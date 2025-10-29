import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import { visualizer } from 'rollup-plugin-visualizer';

const production = !process.env.ROLLUP_WATCH;
const analyze = process.env.ANALYZE === 'true';

// Configuração base
const baseConfig = {
    treeshake: {
        preset: 'recommended',
        moduleSideEffects: false
    },
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }),
        commonjs(),
        production && terser({
            compress: {
                drop_console: true,
                drop_debugger: true,
                passes: 2
            },
            mangle: {
                toplevel: true,
                properties: {
                    regex: /^_/
            }
            },
            format: {
                comments: false
            }
        }),
        analyze && visualizer({
            filename: 'stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true
        })
    ].filter(Boolean)
};

export default [
    // Bundle 1: Main App
    {
        ...baseConfig,
        input: {
            'app': 'js/app.js'
        },
        output: {
            dir: 'dist/js',
            format: 'es',
            entryFileNames: '[name].min.js',
            chunkFileNames: 'chunks/[name]-[hash].min.js',
            sourcemap: !production
        }
    },
    
    // Bundle 2: Player (lazy loaded)
    {
        ...baseConfig,
        input: {
            'app.player': 'js/player.js'
        },
        output: {
            dir: 'dist/js',
            format: 'es',
            entryFileNames: '[name].min.js',
            sourcemap: !production
        }
    },
    
    // Bundle 3: Views (code-split por rota)
    {
        ...baseConfig,
        input: {
            'views.home': 'js/views/home.js',
            'views.search': 'js/views/search.js',
            'views.library': 'js/views/library.js',
            'views.browse': 'js/views/browse.js',
            'views.artist': 'js/views/artist.js',
            'views.album': 'js/views/album.js',
            'views.playlist': 'js/views/playlist.js',
            'views.profile': 'js/views/profile.js',
            'views.settings': 'js/views/settings.js',
            'views.premium': 'js/views/premium.js',
            'views.radio': 'js/views/radio.js',
            'views.podcasts': 'js/views/podcasts.js'
        },
        output: {
            dir: 'dist/js/views',
            format: 'es',
            entryFileNames: '[name].min.js',
            sourcemap: !production
        }
    },
    
    // Bundle 4: API & Utils
    {
        ...baseConfig,
        input: {
            'app.api': 'js/utils/api.js'
        },
        output: {
            dir: 'dist/js',
            format: 'es',
            entryFileNames: '[name].min.js',
            sourcemap: !production
        },
        plugins: [
            ...baseConfig.plugins,
            copy({
                targets: [
                    { src: 'assets/**/*', dest: 'dist/assets' },
                    { src: 'css/bundle.min.css', dest: 'dist/css' }
                ]
            })
        ]
    }
];

