// background.js
const CLIENT_ID = "Ov23liHKg8eo7LpGWT5f";
const CLIENT_SECRET = "bd1f8135c57ed1dcf39489030529f3db3a389775";

// Listener for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "exchangeCode") {
    const code = request.code;

    // Prepare the data for the POST request
    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);
    params.append("code", code);

    // Make the POST request to GitHub to exchange the code for an access token
    fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json", // We expect a JSON response
        "Content-Type": "application/x-www-form-urlencoded", // Content type for URL-encoded form data
      },
      body: params, // Send the URL-encoded parameters
    })
      .then((response) => response.json()) // Parse the JSON response
      .then((data) => {
        if (data.error) {
          sendResponse({ success: false, error: data.error }); // Send error response if any
        } else {
          sendResponse({ success: true, token: data.access_token }); // Send success response with the token
        }
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message }); // Send error response for fetch errors
      });

    return true; // Keep the message channel open for sendResponse
  }
});
