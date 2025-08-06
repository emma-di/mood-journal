from flask import Flask, render_template, request, session
from datetime import datetime

app = Flask(__name__)
app.secret_key = "your-secret-key"

@app.route("/", methods=["GET", "POST"])
def landing():
    if request.method == "POST":
        session["username"] = request.form.get("username")
    username = session.get("username")
    return render_template("landing.html", username=username)

entries = []

@app.route("/journal", methods=["GET", "POST"])
def journal():
    if request.method == "POST":
        new_entry = request.form.get("entry")
        if new_entry:
            date = datetime.now().strftime('%b %d')  # e.g. "Aug 06"
            entries.append({'date': date, 'text': new_entry})
    return render_template("journal.html", entries=entries)

if __name__ == "__main__":
    app.run(debug=True)