const usernameInput = document.getElementById("username");
const syncBtn = document.getElementById("syncBtn");
const statusDiv = document.getElementById("status");

// Load saved username on popup open
chrome.storage.local.get(["leetcodeUsername"], (result) => {
    if (result.leetcodeUsername) {
        usernameInput.value = result.leetcodeUsername;
    }
});

// Save username when input changes
usernameInput.addEventListener("change", () => {
    chrome.storage.local.set({ leetcodeUsername: usernameInput.value });
});

// Sync button handler
syncBtn.addEventListener("click", async () => {
    syncBtn.disabled = true;
    statusDiv.textContent = "Syncing...";
    statusDiv.className = "status info";

    try {
        const response = await chrome.runtime.sendMessage({ action: "syncNow" });

        if (response.success) {
            statusDiv.textContent = `✓ Streak synced! (${response.data.streak} days)`;
            statusDiv.className = "status success";
        } else {
            statusDiv.textContent = `✗ ${response.error || response.message}`;
            statusDiv.className = "status error";
        }
    } catch (error) {
        statusDiv.textContent = `✗ ${error.message}`;
        statusDiv.className = "status error";
    }

    syncBtn.disabled = false;
});


