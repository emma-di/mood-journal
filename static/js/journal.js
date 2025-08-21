// Enhanced journal.js with conversational chat functionality

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('chat-modal');
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('close-modal-btn');
    const minimizeBtn = document.getElementById('minimize-btn');
    const newConversationBtn = document.getElementById('new-conversation-btn');
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const conversationTitle = document.getElementById('conversation-title');
    
    let currentConversationId = null;
    let isMinimized = false;

    // Open modal for new conversation
    newConversationBtn.addEventListener('click', () => {
        openChat();
    });

    // Open modal for existing conversation
    document.querySelectorAll('.conversation-petal[data-conversation-id]').forEach(petal => {
        petal.addEventListener('click', () => {
            const conversationId = parseInt(petal.dataset.conversationId);
            openChat(conversationId);
        });
    });

    // Close modal
    function closeModal() {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
            overlay.classList.add('hidden');
        }, 300);
        currentConversationId = null;
        isMinimized = false;
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Minimize/restore modal
    minimizeBtn.addEventListener('click', () => {
        if (isMinimized) {
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
            minimizeBtn.textContent = '−';
            isMinimized = false;
        } else {
            modal.style.transform = 'translate(-50%, 90%) scale(0.3)';
            minimizeBtn.textContent = '□';
            isMinimized = true;
        }
    });

    // Send message
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Disable input while sending
        sendBtn.disabled = true;
        messageInput.disabled = true;

        // Add user message to chat
        addMessage('user', message);
        messageInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversation_id: currentConversationId
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update conversation ID if it's a new conversation
                if (!currentConversationId) {
                    currentConversationId = data.conversation_id;
                    conversationTitle.textContent = `Journal Session ${data.conversation_id}`;
                }

                // Remove typing indicator and add AI response
                hideTypingIndicator();
                addMessage('assistant', data.response);
            } else {
                hideTypingIndicator();
                addMessage('assistant', `Sorry, there was an error: ${data.error}`);
            }
        } catch (error) {
            hideTypingIndicator();
            addMessage('assistant', 'Sorry, I\'m having trouble connecting right now. Please try again.');
        }

        // Re-enable input
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }

    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    });

    // Open chat modal
    async function openChat(conversationId = null) {
        currentConversationId = conversationId;
        
        // Clear chat messages
        chatMessages.innerHTML = '';
        
        if (conversationId) {
            // Load existing conversation
            try {
                const response = await fetch(`/api/conversation/${conversationId}`);
                const conversation = await response.json();
                
                if (response.ok) {
                    conversationTitle.textContent = conversation.title;
                    
                    // Display all messages
                    conversation.messages.forEach(msg => {
                        addMessage(msg.role, msg.content, false);
                    });
                    
                    scrollToBottom();
                } else {
                    conversationTitle.textContent = 'Conversation Not Found';
                }
            } catch (error) {
                conversationTitle.textContent = 'Error Loading Conversation';
            }
        } else {
            // New conversation
            conversationTitle.textContent = 'New Journal Session';
            addMessage('assistant', 'Hello! I\'m here to listen and support you. How are you feeling today? Feel free to share whatever is on your mind.', false);
        }

        // Show modal
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('show');
            overlay.classList.add('show');
        }, 10);

        messageInput.focus();
    }

    // Add message to chat
    function addMessage(role, content, animate = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        if (animate) {
            // Trigger animation
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(10px)';
            
            requestAnimationFrame(() => {
                messageDiv.style.transition = 'all 0.3s ease-out';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
            });
        }
        
        scrollToBottom();
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-message';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const typingMessage = chatMessages.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    // Scroll to bottom of chat
    function scrollToBottom() {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    // Handle escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Page reload handling - refresh conversations
    if (window.conversationsData && window.conversationsData.length > 0) {
        // If there are new conversations not shown as petals, reload the page
        const currentPetals = document.querySelectorAll('.conversation-petal[data-conversation-id]').length;
        if (currentPetals < window.conversationsData.length) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }
});