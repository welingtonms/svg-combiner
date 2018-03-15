import fs from 'fs';
import { parse } from 'svg-parser';

var args = process.argv.slice(2);
const origin = args[0];
const destination = args[1];

const combine = new Promise((resolve, reject) => {
  fs.readdir(origin, (err, files) => {
    if (err) {
      reject({
        error: err
      });
    }

    const total = files.length;
    const promises = [];

    files.forEach((file, index) => {
      if (!file.endsWith('.svg')) {
        console.log(`[${index + 1} of ${total}] Skipping file ${file}`);
        return;
      }

      console.log(`[${index + 1} of ${total}] Processing file ${file}`);
      const rows = [];

      promises.push(
        new Promise(resolve => {
          fs.readFile(`${origin}/${file}`, 'utf8', (err, data) => {
            if (err) {
              reject({
                error: err
              });
            }

            const id = 'icon-' + file.replace('.svg', '');
            const svg = parse(data);

            const { attributes, children = [] } = svg;
            const attributesAsStr = Object.keys(attributes)
              .filter(key => key !== 'xmlns')
              .map(key => `${key}="${attributes[key]}"`)
              .join(' ');

            children.forEach(child => {
              rows.push(handleNode(child));
            });

            resolve(
              `<symbol id="${id}" ${attributesAsStr}>${rows.join('')}</symbol>`
            );
          });
        })
      );
    });

    Promise.all(promises).then(results => {
      resolve(
        `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n${results.join(
          '\n'
        )}\n</svg>`
      );
    });
  });
});

const handleNode = node => {
  if (!node) {
    return '';
  }

  const { name, children = [], attributes } = node;
  const attributesAsStr = Object.keys(attributes)
    .filter(key => key !== 'xmlns')
    .map(key => `${key}="${attributes[key]}"`)
    .join(' ');

  const shape = `<${name} ${attributesAsStr}>${children.map(child =>
    handleNode(child)
  )}</${name}>`;

  return shape;
};

combine.then(result => {
  fs.writeFile(destination + './combined-svg.svg', result, err => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log('Combined SVG was saved!');
  });
});
