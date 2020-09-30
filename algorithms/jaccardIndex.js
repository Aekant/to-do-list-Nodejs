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

module.exports = function getSimilarity(stringA, stringB) {
  let setA = new Set(stringA);
  let setB = new Set(stringB);
  let _union = union(setA, setB).size;
  let _intersection = intersection(setA, setB).size;
  return similarityIndex = _intersection / _union;
}