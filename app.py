# Enhanced app.py with OpenAI integration
# to run: pip install flask openai>=1.0.0 python-dotenv
# then: python app.py

from flask import Flask, render_template, request, session, jsonify
from datetime import datetime
from openai import OpenAI
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
app.secret_key = "your-secret-key"  # Change this to a secure secret key

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Store conversations in memory (in production, use a database)
conversations = []

@app.route("/", methods=["GET", "POST"])
def landing():
    if request.method == "POST":
        session["username"] = request.form.get("username")
    username = session.get("username")
    return render_template("landing.html", username=username)

@app.route("/journal")
def journal():
    # Get user's conversations for display as petals
    user_conversations = [conv for conv in conversations if conv.get('username') == session.get('username')]
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
        # Create new conversation
        conversation_id = len(conversations) + 1
        conversation = {
            'id': conversation_id,
            'username': username,
            'created_at': datetime.now().strftime('%b %d'),
            'messages': [],
            'title': user_message[:30] + "..." if len(user_message) > 30 else user_message
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