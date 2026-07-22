/* ==========================================================
   Atlas Agent - chat.js
   Chat functionality with enhanced animations
========================================================== */

(function () {
    "use strict";

    // DOM elements
    const form = document.getElementById("form");
    const input = document.getElementById("inp");
    const messages = document.getElementById("msgs");
    const body = document.getElementById("term-body");

    // Exit if required elements are missing
    if (!form || !input || !messages) {
        console.warn('Chat elements not found. Skipping chat initialization.');
        return;
    }

    console.log('Chat initialized');

    // Use relative path for both local and production
    const API_URL = '/chat';

    /**
     * Scroll to bottom of chat with smooth animation
     */
    function scrollBottom() {
        if (body) {
            body.scrollTo({
                top: body.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Add a message to the chat with animation
     */
    function addMessage(sender, text) {
        const wrapper = document.createElement("div");
        wrapper.className = "msg";
        
        const label = document.createElement("div");
        label.className = sender === "atlas" ? "msg-l at" : "msg-l";
        label.textContent = sender;

        const message = document.createElement("div");
        message.className = "msg-t";
        message.textContent = text;

        wrapper.appendChild(label);
        wrapper.appendChild(message);
        messages.appendChild(wrapper);
        
        // Trigger animation after a small delay
        requestAnimationFrame(() => {
            wrapper.classList.add("show");
        });
        
        scrollBottom();
    }

    /**
     * Show thinking indicator with enhanced three dots animation
     */
    function showThinking() {
        removeThinking();
        const div = document.createElement("div");
        div.id = "thinking";
        div.className = "msg";
        
        div.innerHTML = `
            <div class="msg-l at">atlas</div>
            <div class="msg-t thinking-wrapper">
                <span class="thinking-text">Thinking</span>
                <span class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </div>
        `;
        messages.appendChild(div);
        
        // Trigger animation after a small delay
        requestAnimationFrame(() => {
            div.classList.add("show");
        });
        
        scrollBottom();
    }

    /**
     * Remove thinking indicator
     */
    function removeThinking() {
        const thinking = document.getElementById("thinking");
        if (thinking) {
            thinking.classList.remove("show");
            setTimeout(() => {
                thinking.remove();
            }, 300);
        }
    }

    /**
     * Handle form submission
     */
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const message = input.value.trim();
        if (message === "") return;

        console.log(`Sending: ${message}`);

        // Add user message and clear input
        addMessage("you", message);
        input.value = "";
        showThinking();

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: message })
            });

            console.log(`Response status: ${response.status}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Response data:`, data);
            
            removeThinking();
            
            // Extract response properly
            let responseText = "No response from server";
            if (data) {
                if (data.response) {
                    responseText = data.response;
                } else if (data.answer) {
                    responseText = data.answer;
                } else if (data.result) {
                    responseText = data.result;
                } else if (typeof data === 'string') {
                    responseText = data;
                } else {
                    responseText = JSON.stringify(data, null, 2);
                }
            }
            
            addMessage("atlas", responseText);

        } catch (error) {
            console.error("Chat error:", error);
            removeThinking();
            addMessage(
                "atlas",
                `Error: ${error.message}`
            );
        }
    });

    // Allow Enter key to submit
    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            form.dispatchEvent(new Event("submit"));
        }
    });

})();