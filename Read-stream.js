function readStream(stream) {
  let missedErrors = [];

  function onMissedError(err) {
    missedErrors.push(err);
  }

  stream.on("error", onMissedError);

  return function() {
    return new Promise((resolve, reject) => {
      let error = missedErrors.shift();

      if (error) {
        stream.removeListener("error", onMissedError);

        return reject(error);
      }

      stream.on("data", ondata);
      stream.on("end", onend);
      stream.on("error", onerror);
      stream.resume();

      function ondata(chunk) {
        stream.pause();

        cleanup();
        resolve(chunk);
      }

      function onend() {
        cleanup();
        resolve();
      };

      function onerror(err) {
        stream.removeListener("error", onMissedError);

        cleanup();
        reject(err);
      }

      function cleanup() {
        stream.removeListener("data", ondata);
        stream.removeListener("data", onend);
        stream.removeListener("data", onerror);
      }
    });
  }
}

async function read(path) {
  const stream = require("fs").createReadStream(path);

  stream.setEncoding("utf8");

  let data;
  let chunkNum = 0;

  const render = readStream(stream);

  while (data = await render()) {
    process.stdout.write(data);
  }
}

read(__filename).catch(console.error);
