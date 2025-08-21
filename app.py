# Simple working app.py without data persistence
# to run: pip install flask openai>=1.0.0 python-dotenv
# then: python app.py

from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from datetime import datetime, timedelta
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = "journal-app-secret-key-2024"
app.permanent_session_lifetime = timedelta(hours=24)

# Initialize OpenAI client
if not os.getenv('OPENAI_API_KEY'):
    print("Warning: OpenAI API key not set. Add it to your .env file.")
    
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Store conversations in memory (will reset on app restart)
conversations = []

@app.route("/", methods=["GET", "POST"])
def landing():
    if request.method == "POST":
        session.permanent = True
        session["username"] = request.form.get("username")
    username = session.get("username")
    return render_template("landing.html", username=username)

@app.route("/journal")
def journal():
    username = session.get('username')
    if not username:
        return redirect(url_for('landing'))
    
    user_conversations = [conv for conv in conversations if conv.get('username') == username]
    return render_template("journal.html", conversations=user_conversations)

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get('message')
    conversation_id = data.get('conversation_id')
    username = session.get('username')
    
    if not username:
        return jsonify({'error': 'Please set your name first'}), 400
    
    # Find existing conversation or create new one
    conversation = None
    if conversation_id:
        conversation = next((conv for conv in conversations if conv['id'] == conversation_id), None)
    
    if not conversation:
        # Create new conversation with temporary title
        conversation_id = len(conversations) + 1
        
        conversation = {
            'id': conversation_id,
            'username': username,
            'created_at': datetime.now().strftime('%b %d'),
            'messages': [],
            'title': f"Session {conversation_id}"  # Temporary title, will be updated after first exchange
        }
        conversations.append(conversation)
    
    # Add user message
    conversation['messages'].append({
        'role': 'user',
        'content': user_message,
        'timestamp': datetime.now().isoformat()
    })
    
    try:
        # Create OpenAI chat completion
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system", 
                    "content": f"You are a gentle, empathetic journal companion talking to {username}. Provide supportive, thoughtful responses that help them explore their feelings and thoughts. Ask follow-up questions when appropriate. Keep responses warm and conversational. You're like a wise friend who listens carefully."
                }
            ] + [{"role": msg["role"], "content": msg["content"]} for msg in conversation['messages']],
            max_tokens=300,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Add AI response to conversation
        conversation['messages'].append({
            'role': 'assistant',
            'content': ai_response,
            'timestamp': datetime.now().isoformat()
        })
        
        # Update conversation title based on the first user message if it's still the default
        if conversation['title'] == f"Session {conversation['id']}" and len(conversation['messages']) == 2:
            # Create a summary-based title from the first user message
            try:
                summary_response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": "Create a short, 2-4 word title that captures the main theme of this journal entry. Keep it simple and descriptive. Examples: 'Summer Reflection', 'Work Stress', 'Family Time', 'Feeling Lost', 'Career Thoughts'"
                        },
                        {
                            "role": "user",
                            "content": f"Create a title for this journal entry: {user_message}"
                        }
                    ],
                    max_tokens=20,
                    temperature=0.3
                )
                new_title = summary_response.choices[0].message.content.strip().replace('"', '')
                conversation['title'] = new_title
            except:
                # Fallback to first few words if AI summary fails
                title_words = user_message.split()[:3]
                conversation['title'] = ' '.join(title_words)
                if len(user_message.split()) > 3:
                    conversation['title'] += "..."
        
        return jsonify({
            'response': ai_response,
            'conversation_id': conversation_id
        })
        
    except Exception as e:
        return jsonify({'error': f'OpenAI API error: {str(e)}'}), 500

@app.route("/api/conversation/<int:conversation_id>")
def get_conversation(conversation_id):
    username = session.get('username')
    conversation = next((conv for conv in conversations if conv['id'] == conversation_id and conv['username'] == username), None)
    
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404
    
    return jsonify(conversation)

if __name__ == "__main__":
    app.run(debug=True)