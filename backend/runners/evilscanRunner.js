import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Evilscan = require("evilscan");

export function runEvilScan(options) {
  return new Promise((resolve, reject) => {
    try {
      const scan = new Evilscan(options);
      const results = [];

      scan.on("result", data => {
        results.push({
          ip: data.ip,
          port: data.port,
          status: data.status
        });
      });

      scan.on("done", () => {
        resolve(results);
      });

      scan.on("error", err => {
        reject(err);
      });

      scan.run();
    } catch (err) {
      reject(err);
    }
  });
}

export default runEvilScan;