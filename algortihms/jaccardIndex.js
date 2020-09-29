module.exports = function similarStrings(tasks) {
  // tasks is an array of tasks slugs
  // we will have to create a set from an array in each iteration therefore splitting the array elements on each
  // iteration
  // it is better to split all indexes once and for all making a 2D array
  tasks = tasks.map(el => el.split('-'));

  const mostSimilar = {
    similarityIndex: 0,
    task1: 0,
    task2: 0
  }

  for (var i = 0; i < tasks.length - 1; i++) {
    for (var j = i + 1; j < tasks.length; j++) {
      let setA = new Set(tasks[i]);
      let setB = new Set(tasks[j]);
      let _union = union(setA, setB).size;
      let _intersection = intersection(setA, setB).size;
      let similarityIndex = _intersection / _union;

      if (similarityIndex > mostSimilar.similarityIndex) {
        mostSimilar.similarityIndex = similarityIndex;
        mostSimilar.task1 = i;
        mostSimilar.task2 = j;
      }
    }
  }

  return mostSimilar;
}

function union(setA, setB) {
  // create a set form setA
  let _union = new Set(setA);
  // for each iterable of setB add it in _union
  // only takes unique items
  for (let elem of setB) {
    _union.add(elem);
  }
  return _union;
}

function intersection(setA, setB) {
  // create an empty set first
  let _intersection = new Set();
  // iterate over any of the set
  for (let item of setA) {
    if (setB.has(item)) {
      // if true then it is an intersection
      _intersection.add(item);
    }
  }

  return _intersection;
}