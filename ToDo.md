Task 1 - Bug Fix:
- The expandedTests state management has a bug where expanding one test 
  sometimes affects others. Find and fix the issue.

Task 2 - Feature:
- Implement the "Duplicate Test" feature:
  - Add a duplicate button next to each test id ✅
  - When clicked, create a copy of the test with "(Copy)" appended to the name ✅
  - Ensure the new test has a unique ID ✅
  - Add proper loading state during duplication ✅
  - Handle errors appropriately ✅

Task 3 - Polling Enhancement:
- The current polling mechanism needs improvement:
  - Add a maximum polling duration (timeout after 30 seconds) ✅
  - Implement exponential backoff for the polling interval ✅
  - Add proper cleanup when component unmounts ✅
  - Add visual feedback for polling status ✅

Task 4 - Error Handling:
- Add error handling for the API calls:
  - Show a toast notification for errors ✅
  - Log errors to the console ✅
  - Add a retry mechanism with exponential backoff ✅
