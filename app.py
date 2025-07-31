from flask import Flask, render_template, request, session

app = Flask(__name__)
app.secret_key = "your-secret-key"

@app.route("/", methods=["GET", "POST"])
def landing():
    if request.method == "POST":
        session["username"] = request.form.get("username")
    username = session.get("username")
    return render_template("landing.html", username=username)

if __name__ == "__main__":
    app.run(debug=True)