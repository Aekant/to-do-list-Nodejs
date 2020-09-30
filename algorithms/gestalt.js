// this algorithm is not commutative
module.exports = function gestaltSimilarity(stringA, stringB) {
  // stores the given two tasks
  let stack = [stringA, stringB];
  let score = 0;

  while (stack.length !== 0) {
    const subStringA = stack.pop(); // takes the last element in array
    const subStringB = stack.pop();

    let longestSeqLength = 0;
    let longestSeqIndexA = -1;
    let longestSeqIndexB = -1;

    for (let i = 0; i < subStringA.length; i++) {
      for (let j = 0; j < subStringB.length; j++) {
        let k = 0;

        while (
          (i + k < subStringA.length) &&
          (j + k < subStringB.length) &&
          (subStringA.charAt(i + k) === subStringB.charAt(j + k))
        ) {
          k++;
        }

        if (k > longestSeqLength) {
          longestSeqLength = k;
          longestSeqIndexA = i;
          longestSeqIndexB = j;
          // the sub string would be from i to i+k and j to j+k
        }
      }
    }

    // if we are out of this loop we have found the longest matching substring which starts from index i and ends at i+k
    // and for string B starts at j and ends at j+k and its length is k 
    if (longestSeqLength > 0) {
      // if its greater than zero that means we did find a matching string
      score += longestSeqLength * 2;

      // if our match didn't start from postion 0 which means it has a left string so 
      if (longestSeqIndexA !== 0 && longestSeqIndexB !== 0) {
        stack.push(subStringA.substring(0, longestSeqIndexA));
        stack.push(subStringB.substring(0, longestSeqIndexB));
        // well this if statement executes only if both strings have left strings because the algorithm works that way
        // find longest string then break it in left and right, if only one string has left string or both strings dont
        // have left strings just ignore it
      }
      if (
        longestSeqIndexA + longestSeqLength < subStringA.length &&
        longestSeqIndexB + longestSeqLength < subStringB.length) {
        // this statement runs only if both strings have right stringss
        stack.push(subStringA.substring(longestSeqIndexA + longestSeqLength, subStringA.length));
        stack.push(subStringB.substring(longestSeqIndexB + longestSeqLength, subStringB.length));
      }

      // these strings get pushed in stack only if there was a substring match, if there weren't any match the stack 
      // would be empty and the second iteration would never happen.
    }
  }

  return score / (stringA.length + stringB.length);
}