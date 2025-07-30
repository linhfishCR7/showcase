const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
        files: 5 // Maximum 5 files per request
    },
    fileFilter: fileFilter
});

// Image processing middleware
const processImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    try {
        const processedFiles = [];

        for (const file of req.files) {
            // Create different sizes for logos and screenshots
            const sizes = {
                thumbnail: { width: 150, height: 150 },
                medium: { width: 400, height: 400 },
                large: { width: 800, height: 600 }
            };

            const processedFile = {
                original: file,
                sizes: {}
            };

            for (const [sizeName, dimensions] of Object.entries(sizes)) {
                const outputPath = path.join(
                    uploadsDir,
                    `${path.parse(file.filename).name}-${sizeName}${path.extname(file.filename)}`
                );

                await sharp(file.path)
                    .resize(dimensions.width, dimensions.height, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: 85 })
                    .png({ quality: 85 })
                    .toFile(outputPath);

                processedFile.sizes[sizeName] = {
                    path: outputPath,
                    url: `/uploads/${path.basename(outputPath)}`
                };
            }

            processedFiles.push(processedFile);
        }

        req.processedFiles = processedFiles;
        next();
    } catch (error) {
        console.error('Image processing error:', error);
        next(error);
    }
};

// Clean up temporary files
const cleanupFiles = (files) => {
    if (!files) return;
    
    files.forEach(file => {
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch (error) {
            console.error('Error cleaning up file:', error);
        }
    });
};

module.exports = {
    upload,
    processImages,
    cleanupFiles
};
