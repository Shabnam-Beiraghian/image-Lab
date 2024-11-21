const path = require("path");
const { unzip, readDir, grayScale, sepia, invert } = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");
const pathSepia = path.join(__dirname, "sepia");
const pathInverted = path.join(__dirname, "inverted");
const fs = require('fs');

const processImages = async () => {
    try {
        await unzip(zipFilePath, pathUnzipped);
        console.log('Unzipped.');

        const pngFiles = await readDir(pathUnzipped);
        console.log('PNG', pngFiles);

        await fs.promises.mkdir(pathProcessed, { recursive: true });
        await fs.promises.mkdir(pathSepia, { recursive: true });
        await fs.promises.mkdir(pathInverted, { recursive: true });

        for (const file of pngFiles) {
            const fileName = path.basename(file);

            const grayFilePath = path.join(pathProcessed, fileName);
            await grayScale(file, grayFilePath);
            console.log(`Grayscale: ${fileName}`);

            const sepiaFilePath = path.join(pathSepia, fileName);
            await sepia(file, sepiaFilePath);
            console.log(`Sepia: ${fileName}`);

            const invertFilePath = path.join(pathInverted, fileName);
            await invert(file, invertFilePath);
            console.log(`Inverted: ${fileName}`);
        }

    } catch (err) {
        console.log('Error', err);
    }
};


processImages();
