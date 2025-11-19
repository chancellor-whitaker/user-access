export const getJsonPromise = (url) =>
  fetch(url).then((response) => response.json());

export const toTruthyArray = (array) => [array].filter(Boolean).flat();

export const findNewSetElements = (oldSet, newSet) =>
  [...newSet].filter((el) => !oldSet.has(el));
