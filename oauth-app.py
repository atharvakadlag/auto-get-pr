from flask import Flask, jsonify, request, redirect
import requests

app = Flask(__name__)

CLIENT_ID = "Ov23liHKg8eo7LpGWT5f"  # Replace with your GitHub Client ID
CLIENT_SECRET = "bd1f8135c57ed1dcf39489030529f3db3a389775"  # Replace with your GitHub Client Secret
REDIRECT_URI = "https://94b3-119-82-110-238.ngrok-free.app/"  # Replace with your ngrok URL


@app.route("/")
def callback():
    # Get the code from the request
    code = request.args.get("code")
    if not code:
        return "Error: No code provided", 400

    # Exchange the code for an access token
    token_response = requests.post(
        "https://github.com/login/oauth/access_token",
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
        },
        headers={"Accept": "application/json"},
    )

    token_json = token_response.json()
    access_token = token_json.get("access_token")

    if access_token:
        print("Access Token: ", access_token)
        return jsonify({"access_token": access_token})
    else:
        print("Error: Unable to retrieve access token")
        print(token_json)
        return "Error: Unable to retrieve access token", 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
