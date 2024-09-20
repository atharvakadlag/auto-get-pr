// popup.js

let accessToken = "";

const CLIENT_ID = "Ov23liHKg8eo7LpGWT5f";
// popup.js

// Function to handle the OAuth flow
function authenticateWithGitHub() {
  const clientId = CLIENT_ID; // Client ID for the GitHub OAuth app
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`; // Redirect URI for the extension

  // Launch the OAuth flow
  chrome.identity.launchWebAuthFlow(
    {
      url: `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`,
      interactive: true,
    },
    function (redirectUrl) {
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error("Error during authentication:", chrome.runtime.lastError);
        return;
      }

      // Extract the authorization code from the redirect URL
      const urlParams = new URLSearchParams(new URL(redirectUrl).search);
      const code = urlParams.get("code");

      if (code) {
        // Send the code to the background script to exchange for an access token
        chrome.runtime.sendMessage(
          { type: "exchangeCode", code: code },
          function (response) {
            if (chrome.runtime.lastError) {
              console.error(
                "Error during message send:",
                chrome.runtime.lastError
              );
              return;
            }

            if (response) {
              if (response.success) {
                accessToken = response.token; // Store the access token
                console.log("Access Token:", accessToken);
                document.getElementById("fetchIssuesButton").disabled = false; // Enable the fetch PRs button
                document.getElementById("status").textContent =
                  "Logged in successfully!";

                // Fetch the user's profile information
                fetchUserProfile();
              } else {
                console.error("Error:", response.error);
                document.getElementById(
                  "status"
                ).textContent = `Error: ${response.error}`;
              }
            } else {
              console.error("No response received.");
            }
          }
        );
      } else {
        console.error("No authorization code found.");
      }
    }
  );
}

// Function to fetch the user's profile information
function fetchUserProfile() {
  fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Authorization: `token ${accessToken}`, // Use the access token for authentication
      Accept: "application/vnd.github.v3+json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((user) => {
      // Display the username in the popup
      const usernameDiv = document.getElementById("username");
      usernameDiv.textContent = `Logged in as: ${user.login}`; // Display the GitHub username
    })
    .catch((error) => {
      console.error("Error fetching user profile:", error);
      document.getElementById(
        "status"
      ).textContent = `Error fetching user profile: ${error.message}`;
    });
}

// Function to fetch issues assigned to the authenticated user
function fetchAssignedIssues() {
  console.log("Fetching issues");
  if (!accessToken) {
    console.error("No access token available.");
    return;
  }

  fetch("https://api.github.com/issues?filter=assigned&state=open", {
    method: "GET",
    headers: {
      Authorization: `token ${accessToken}`, // Use the access token for authentication
      Accept: "application/vnd.github+json", // Set the accept header for the API response
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((issues) => {
      // Display the issues in the popup
      const issuesList = document.getElementById("issuesList");
      issuesList.innerHTML = ""; // Clear previous results
      console.log("found issues count: ", issues.length);
      if (issues.length === 0) {
        issuesList.innerHTML = "<p>No issues assigned to you.</p>";
      } else {
        issues.forEach((issue) => {
          if (issue.pull_request) {
            const issueItem = document.createElement("div");
            issueItem.innerHTML = `
            <strong>Pull Request: <a href="${issue.html_url}" target="_blank">${issue.title}</a></strong><br>
            Created by: <a href="${issue.user.html_url}" target="_blank">${issue.user.login}</a><br>
            <hr>
            `;
            issuesList.appendChild(issueItem);
          }
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching assigned issues:", error);
      document.getElementById(
        "status"
      ).textContent = `Error fetching issues: ${error.message}`;
    });
}

// Call fetchAssignedIssues when the relevant button is clicked
document
  .getElementById("fetchIssuesButton")
  .addEventListener("click", fetchAssignedIssues);

// Call the authentication function when the login button is clicked
document
  .getElementById("loginButton")
  .addEventListener("click", authenticateWithGitHub);
