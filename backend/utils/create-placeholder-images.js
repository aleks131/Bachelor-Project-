const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../../data/content/demo-images');

// Helper to create a placeholder image with text
async function createPlaceholderImage(outputPath, width, height, text, bgColor = '#1e3a8a', textColor = '#ffffff') {
    // Escape text for XML/SVG
    const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    
    // Split text by newlines and create tspan elements
    const lines = escapedText.split('\n');
    const fontSize = Math.min(width, height) / 8;
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2 + fontSize;
    
    const tspans = lines.map((line, index) => 
        `<tspan x="50%" y="${startY + (index * lineHeight)}" dy="${index === 0 ? 0 : lineHeight}">${line}</tspan>`
    ).join('');
    
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" font-weight="bold">
    ${tspans}
  </text>
</svg>`;
    
    await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
    
    console.log(`✓ Created: ${outputPath}`);
}

// Create KPI placeholder images
async function createKPIPlaceholders() {
    const kpiDir = path.join(baseDir, 'kpi');
    
    // Create kpi1 folder if it doesn't exist
    const kpi1Dir = path.join(kpiDir, 'kpi1');
    if (!fs.existsSync(kpi1Dir)) {
        fs.mkdirSync(kpi1Dir, { recursive: true });
    }
    
    // Create kpi2 folder if it doesn't exist
    const kpi2Dir = path.join(kpiDir, 'kpi2');
    if (!fs.existsSync(kpi2Dir)) {
        fs.mkdirSync(kpi2Dir, { recursive: true });
    }
    
    // Create production KPIs (kpi1 folder)
    await createPlaceholderImage(
        path.join(kpi1Dir, 'kpi-card-1.png'),
        800, 600,
        'Production KPI\n95% Efficiency',
        '#1e3a8a',
        '#ffffff'
    );
    
    await createPlaceholderImage(
        path.join(kpi1Dir, 'kpi-card-2.png'),
        800, 600,
        'Production KPI\n88% Quality',
        '#1e3a8a',
        '#ffffff'
    );
    
    // Create other category KPIs (kpi2 folder)
    await createPlaceholderImage(
        path.join(kpi2Dir, 'dashboard-kpi-1.png'),
        800, 600,
        'People KPI\n95% Satisfaction',
        '#059669',
        '#ffffff'
    );
    
    await createPlaceholderImage(
        path.join(kpi2Dir, 'dashboard-kpi-2.png'),
        800, 600,
        'Customer KPI\n98% Retention',
        '#dc2626',
        '#ffffff'
    );
    
    // Create additional KPI images for all categories
    const categories = [
        { name: 'production', color: '#1e3a8a', folder: 'kpi1' },
        { name: 'people', color: '#059669', folder: 'kpi2' },
        { name: 'customer', color: '#dc2626', folder: 'kpi2' },
        { name: 'cost', color: '#ea580c', folder: 'kpi2' }
    ];
    
    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const folder = category.folder === 'kpi1' ? kpi1Dir : kpi2Dir;
        const filename = `kpi-${category.name}-${i + 1}.png`;
        
        await createPlaceholderImage(
            path.join(folder, filename),
            800, 600,
            `${category.name.charAt(0).toUpperCase() + category.name.slice(1)} KPI\nPerformance Metric`,
            category.color,
            '#ffffff'
        );
    }
}

// Create Gallery placeholder images
async function createGalleryPlaceholders() {
    const galleryDir = path.join(baseDir, 'gallery');
    
    // Create a 'placeholders' folder in gallery
    const placeholdersDir = path.join(galleryDir, 'placeholders');
    if (!fs.existsSync(placeholdersDir)) {
        fs.mkdirSync(placeholdersDir, { recursive: true });
    }
    
    // Create Numbers Image
    await createPlaceholderImage(
        path.join(placeholdersDir, 'numbers-image.png'),
        1200, 800,
        'Numbers Dashboard\nKey Metrics & Statistics',
        '#4f46e5',
        '#ffffff'
    );
    
    // Create Plan Image
    await createPlaceholderImage(
        path.join(placeholdersDir, 'plan-image.png'),
        1200, 800,
        'Daily Plan\nSchedule & Tasks',
        '#0891b2',
        '#ffffff'
    );
    
    // Copy to root gallery folder for easy access
    await createPlaceholderImage(
        path.join(galleryDir, 'numbers-image.png'),
        1200, 800,
        'Numbers Dashboard\nKey Metrics & Statistics',
        '#4f46e5',
        '#ffffff'
    );
    
    await createPlaceholderImage(
        path.join(galleryDir, 'plan-image.png'),
        1200, 800,
        'Daily Plan\nSchedule & Tasks',
        '#0891b2',
        '#ffffff'
    );
}

// Main execution
async function main() {
    console.log('Creating placeholder images...\n');
    
    try {
        // Ensure base directories exist
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
        
        await createKPIPlaceholders();
        console.log('');
        await createGalleryPlaceholders();
        
        console.log('\n✓ All placeholder images created successfully!');
    } catch (error) {
        console.error('Error creating placeholder images:', error);
        process.exit(1);
    }
}

main();

