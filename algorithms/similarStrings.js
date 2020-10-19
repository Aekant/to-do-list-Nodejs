const jaccardSimilarity = require('./jaccardIndex');
const gestaltSimilarity = require('./gestalt');

module.exports = function similarStrings(tasks) {
  // takes a tasks slugs array
  return new Promise((res, rej) => {
    try {
      const mostSimilar = {
        similarityIndex: 0,
        task1: 0,
        task2: 0
      }

      for (var i = 0; i < tasks.length - 1; i++) {
        for (var j = i + 1; j < tasks.length; j++) {

          let similarityIndex1 = gestaltSimilarity(tasks[i], tasks[j]);
          let similarityIndex2 = jaccardSimilarity(tasks[i].split('-'), tasks[j].split('-'));

          let similarityIndex = (similarityIndex1 + similarityIndex2) / 2;

          if (similarityIndex > mostSimilar.similarityIndex) {
            mostSimilar.similarityIndex = similarityIndex;
            mostSimilar.task1 = i;
            mostSimilar.task2 = j;
          }
        }
      }

      res(mostSimilar);

    } catch (err) {
      rej(err);
    }
  });
}
