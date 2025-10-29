// Test script to check exam submission logic
const answers = [
  { questionId: "test-q-1", selectedAnswers: [0, 1] },
  { questionId: "test-q-2", selectedAnswers: [] },
  { questionId: "test-q-3", selectedAnswers: [2] }
];

console.log("Testing answer format:");
console.log(JSON.stringify({ examId: "test-exam-id", answers }, null, 2));

// Test array comparison
const correctIndexes = [0, 1, 2].sort();
const selectedSorted = [0, 1].sort();

const isCorrect = correctIndexes.length === selectedSorted.length &&
  correctIndexes.every((val, idx) => val === selectedSorted[idx]);

console.log("\nArray comparison test:");
console.log("Correct indexes:", correctIndexes);
console.log("Selected indexes:", selectedSorted);
console.log("Is correct?", isCorrect);

console.log("\nTest completed successfully!");
