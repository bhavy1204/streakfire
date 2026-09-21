// Runs on every LeetCode page
// Listens for messages from popup and extracts streak data

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStreakData") {
    const streakData = extractStreakData();
    sendResponse(streakData);
  }
});

function extractStreakData() {
  try {
    // Method 1: Try to find streak from the profile badge/card
    const streakElement = document.querySelector('[data-testid="profile-badge-streak"]');
    if (streakElement) {
      const streakText = streakElement.textContent;
      const streakCount = parseInt(streakText.match(/\d+/)[0], 10);
      return {
        success: true,
        streak: streakCount,
        timestamp: new Date().toISOString(),
        method: "badge"
      };
    }

    // Method 2: Look for streak info in the page content
    const pageText = document.body.innerText;
    const streakMatch = pageText.match(/(\d+)\s*day[s]?\s*streak/i);
    if (streakMatch) {
      return {
        success: true,
        streak: parseInt(streakMatch[1], 10),
        timestamp: new Date().toISOString(),
        method: "text_search"
      };
    }

    // Method 3: Check local storage or session storage for GraphQL response
    // LeetCode might cache user data here
    const userDataStr = localStorage.getItem("leetcode_userdata");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.streakCounter) {
          return {
            success: true,
            streak: userData.streakCounter.streakCount,
            timestamp: new Date().toISOString(),
            method: "localStorage"
          };
        }
      } catch (e) {
        console.error("Failed to parse localStorage:", e);
      }
    }

    return {
      success: false,
      error: "Could not find streak data on the page",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}


