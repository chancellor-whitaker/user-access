import customCsv from "./customCsv";

// Patch d3.csv if d3 is loaded globally
if (window.d3 && window.d3.csv) {
  //   const originalD3Csv = window.d3.csv;
  window.d3.csv = customCsv;
  console.log("d3.csv has been replaced with the custom CSV function.");
} else {
  console.warn("d3.csv not found!");
}
