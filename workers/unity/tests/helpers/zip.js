import yauzl from "yauzl";

function openZip(zipPath) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err);
      } else {
        resolve(zipfile);
      }
    });
  });
}

export async function listEntries(zipPath) {
  const zipfile = await openZip(zipPath);
  const entries = [];
  return new Promise((resolve, reject) => {
    zipfile.on("entry", (entry) => {
      entries.push(entry.fileName);
      zipfile.readEntry();
    });
    zipfile.once("end", () => {
      zipfile.close();
      resolve(entries);
    });
    zipfile.once("error", (error) => {
      zipfile.close();
      reject(error);
    });
    zipfile.readEntry();
  });
}

export async function readEntry(zipPath, fileName) {
  const zipfile = await openZip(zipPath);
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      zipfile.close();
      reject(error);
    };

    zipfile.on("entry", (entry) => {
      if (entry.fileName === fileName) {
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) {
            onError(err);
            return;
          }

          const chunks = [];
          readStream.on("data", (chunk) => chunks.push(chunk));
          readStream.on("end", () => {
            zipfile.close();
            resolve(Buffer.concat(chunks).toString("utf8"));
          });
          readStream.on("error", onError);
        });
      } else {
        zipfile.readEntry();
      }
    });

    zipfile.once("end", () => onError(new Error(`Entry not found: ${fileName}`)));
    zipfile.once("error", onError);
    zipfile.readEntry();
  });
}
