const fs = require("fs");
const path = require("path");
const yauzl = require('yauzl-promise');
const { pipeline } = require('stream/promises');

/**
 * Decompress a zip file from pathIn and extract to pathOut
 * @param {string} pathIn - Path to the input zip file
 * @param {string} pathOut - Directory to extract the files into
 * @returns {Promise} - Resolves when extraction is complete
 */
const unzip = async (pathIn, pathOut) => {
  const zip = await yauzl.open(pathIn);
  try {
    await fs.promises.mkdir(pathOut, { recursive: true });

    for await (const entry of zip) {
      if (entry.filename.endsWith("/")) {
        await fs.promises.mkdir(path.join(pathOut, entry.filename));
      } else {
        const readStream = await entry.openReadStream();
        const writeStream = fs.createWriteStream(path.join(pathOut, entry.filename));
        await pipeline(readStream, writeStream);
      }
    }
    console.log("Extraction operation complete");
  } finally {
    await zip.close();
  }
};

module.exports = { unzip };


/**
 * Reads the directory and returns an array of PNG file paths
 * @param {string} dir - The directory path to read
 * @returns {Promise<string[]>} - A promise that resolves with an array of PNG file paths
 */
const readDir = async (dir) => {
    try {
      const files = await fs.promises.readdir(dir);
      const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');
      return pngFiles.map(file => path.join(dir, file));
    } catch (err) {
      console.error("Error reading directory:", err);
      throw err;
    }
  };
  
  module.exports = { readDir };
  

  const path = require("path");
  const { unzip, readDir, grayScale } = require("./IOhandler");
  
  // Define the paths
  const zipFilePath = path.join(__dirname, "myfile.zip");  // Path to the zip file
  const pathUnzipped = path.join(__dirname, "unzipped");  // Directory to unzip files into
  const pathProcessed = path.join(__dirname, "grayscaled");  // Directory to save grayscaled images
  
  // Function to process images
  const processImages = async () => {
    try {
      // Step 1: Unzip the zip file
      await unzip(zipFilePath, pathUnzipped);
      console.log('Unzip complete.');
  
      // Step 2: Read the directory for PNG files
      const pngFiles = await readDir(pathUnzipped);
      console.log('PNG files found:', pngFiles);
  
      // Step 3: Create a directory for grayscaled images (if it doesn't exist)
      await fs.promises.mkdir(pathProcessed, { recursive: true });
  
      // Step 4: Convert each PNG image to grayscale and save it
      for (const file of pngFiles) {
        const fileName = path.basename(file);
        const grayFilePath = path.join(pathProcessed, fileName);
        await grayScale(file, grayFilePath);
        console.log(`Processed and saved: ${fileName}`);
      }
  
    } catch (err) {
      console.error('Error processing images:', err);
    }
  };
  
  // Run the processImages function to start the entire process
  processImages();
  