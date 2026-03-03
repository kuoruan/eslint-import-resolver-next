import { runAsWorker } from "synckit";

runAsWorker(async (...args) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(args);
    }, 5000);
  });
});
