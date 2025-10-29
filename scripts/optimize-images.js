const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
    console.log('🖼️  Otimizando imagens...');
    
    const assetsDir = path.join(__dirname, '../assets/images');
    const outputDir = path.join(__dirname, '../dist/assets/images');
    
    // Criar diretório de saída
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Converter para WebP
    const files = await imagemin([`${assetsDir}/**/*.{jpg,png,jpeg}`], {
        destination: outputDir,
        plugins: [
            imageminWebp({
                quality: 85, // Balanceado
                method: 6    // Compressão máxima
            })
        ]
    });
    
    console.log(`✅ ${files.length} imagens convertidas para WebP`);
    
    // Copiar SVGs (já são otimizados)
    const svgFiles = fs.readdirSync(assetsDir, { recursive: true })
        .filter(file => file.endsWith('.svg'));
    
    svgFiles.forEach(file => {
        const src = path.join(assetsDir, file);
        const dest = path.join(outputDir, file);
        fs.copyFileSync(src, dest);
    });
    
    console.log(`✅ ${svgFiles.length} arquivos SVG copiados`);
    
    // Gerar thumbnails em múltiplos tamanhos
    console.log('📐 Gerando responsive thumbnails...');
    // TODO: Implementar geração de thumbnails 120px, 250px, 500px
    
    console.log('🎉 Otimização de imagens concluída!');
}

optimizeImages().catch(console.error);



