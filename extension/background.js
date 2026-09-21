// Background service worker
// Handles scheduled streak syncing and communication

const BACKEND_URL = "https://your-railway-backend.com"; // Update this
const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in ms

// Listen for install to set up initial alarm
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("syncStreak", { periodInMinutes: 24 * 60 });
    console.log("LeetCode Streak Tracker installed. Syncing daily.");
});

// Trigger sync on alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "syncStreak") {
        syncStreak();
    }
});

// Listen for manual sync requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "syncNow") {
        syncStreak().then(sendResponse).catch((err) => sendResponse({ error: err.message }));
        return true; // Keep channel open for async response
    }
});

async function syncStreak() {
    try {
        // Get last synced date to avoid duplicates
        const storage = await chrome.storage.local.get(["lastSyncDate", "leetcodeUsername"]);
        const today = new Date().toISOString().split("T")[0];

        if (storage.lastSyncDate === today) {
            console.log("Already synced today, skipping...");
            return { success: false, message: "Already synced today" };
        }

        // Open LeetCode profile in a tab to get streak data
        const tabs = await chrome.tabs.query({ url: "https://leetcode.com/*" });
        if (tabs.length === 0) {
            throw new Error("Open LeetCode.com first");
        }

        // Send message to content script to extract streak
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
            action: "getStreakData"
        });

        if (!response.success) {
            throw new Error(response.error);
        }

        // Send to backend
        const username = storage.leetcodeUsername || "default_user"; // Default fallback
        const payload = {
            username,
            streak: response.streak,
            date: today,
            timestamp: response.timestamp
        };

        const backendResponse = await fetch(`${BACKEND_URL}/api/streak`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!backendResponse.ok) {
            throw new Error(`Backend error: ${backendResponse.statusText}`);
        }

        const data = await backendResponse.json();

        // Update last sync date
        await chrome.storage.local.set({
            lastSyncDate: today,
            lastSyncTime: new Date().toISOString()
        });

        console.log("Streak synced successfully:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Sync failed:", error.message);
        return { success: false, error: error.message };
    }
}



