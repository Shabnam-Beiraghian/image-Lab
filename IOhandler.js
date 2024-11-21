const fs = require("fs");
const { PNG } = require("pngjs");
const path = require("path");
const yauzl = require('yauzl-promise');
const { pipeline } = require('stream/promises');

/**
 * Description: Decompress file from given pathIn, write to given pathOut
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {Promise}
 */
const unzip = async (pathIn, pathOut) => {
  const zip = await yauzl.open(pathIn);
  try {
    await fs.promises.mkdir(pathOut, { recursive: true });

    for await (const entry of zip) {
      if (entry.filename.startsWith('__MACOSX') || entry.filename.startsWith('.DS_Store')) {
        continue;
      }

      if (entry.filename.endsWith("/")) {
        await fs.promises.mkdir(path.join(pathOut, entry.filename), { recursive: true });
      } else {
        const readStream = await entry.openReadStream();
        const writeStream = fs.createWriteStream(path.join(pathOut, entry.filename));
        await pipeline(readStream, writeStream);
      }
    }
    console.log("Completed.");
  } finally {
    await zip.close();
  }
};

/**
 * Description: Read all the png files from a given directory and return a Promise containing array of each png file path
 * @param {string} dir
 * @return {Promise<string[]>}
 */
const readDir = async (dir) => {
  try {
    const files = await fs.promises.readdir(dir);
    const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');
    return pngFiles.map(file => path.join(dir, file));
  } catch (err) {
    console.error("Directory:", err);
    throw err;
  }
};

/**
 * Description: Read in png file by given pathIn, convert to grayscale, and write to given pathOut
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {Promise}
 */
const grayScale = (pathIn, pathOut) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(pathIn)
      .pipe(new PNG())
      .on("parsed", function () {
        for (let i = 0; i < this.data.length; i += 4) {
          const red = this.data[i];
          const green = this.data[i + 1];
          const blue = this.data[i + 2];

          const gray = Math.round((red + green + blue) / 3);
          this.data[i] = gray;
          this.data[i + 1] = gray;
          this.data[i + 2] = gray;
        }

        this.pack()
          .pipe(fs.createWriteStream(pathOut))
          .on("finish", resolve)
          .on("error", reject);
      })
      .on("error", reject);
  });
};

/**
 * Description: Apply sepia filter to a PNG image and save it to the given pathOut
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {Promise}
 */
const sepia = (pathIn, pathOut) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(pathIn)
      .pipe(new PNG())
      .on("parsed", function () {

        for (let i = 0; i < this.data.length; i += 4) {
          let red = this.data[i];
          let green = this.data[i + 1];
          let blue = this.data[i + 2];

          const newRed = Math.min(255, (0.393 * red + 0.769 * green + 0.189 * blue));
          const newGreen = Math.min(255, (0.349 * red + 0.686 * green + 0.168 * blue));
          const newBlue = Math.min(255, (0.272 * red + 0.534 * green + 0.131 * blue));

          this.data[i] = newRed;
          this.data[i + 1] = newGreen;
          this.data[i + 2] = newBlue;
        }

        this.pack()
          .pipe(fs.createWriteStream(pathOut))
          .on("finish", resolve)
          .on("error", reject);
      })
      .on("error", reject);
  });
};

/**
 * Description: Invert the colors of the PNG image and save it to the given pathOut
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {Promise}
 */
const invert = (pathIn, pathOut) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(pathIn)
      .pipe(new PNG())
      .on("parsed", function () {

        for (let i = 0; i < this.data.length; i += 4) {
          let red = this.data[i];
          let green = this.data[i + 1];
          let blue = this.data[i + 2];

          this.data[i] = 255 - red;
          this.data[i + 1] = 255 - green;
          this.data[i + 2] = 255 - blue;
        }

        this.pack()
          .pipe(fs.createWriteStream(pathOut))
          .on("finish", resolve)
          .on("error", reject);
      })
      .on("error", reject);
  });
};

module.exports = {
  unzip,
  readDir,
  grayScale,
  sepia,
  invert
};