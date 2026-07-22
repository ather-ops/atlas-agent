/* ==========================================================
   Atlas Agent - chat.js
   Chat functionality only
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

    /**
     * Scroll to bottom of chat
     */
    function scrollBottom() {
        if (body) {
            body.scrollTop = body.scrollHeight;
        }
    }

    /**
     * Add a message to the chat
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
        scrollBottom();
    }

    /**
     * Show thinking indicator
     */
    function showThinking() {
        removeThinking();
        const div = document.createElement("div");
        div.id = "thinking";
        div.className = "msg";
        div.innerHTML = `
            <div class="msg-l at">atlas</div>
            <div class="msg-t">Thinking...</div>
        `;
        messages.appendChild(div);
        scrollBottom();
    }

    /**
     * Remove thinking indicator
     */
    function removeThinking() {
        const thinking = document.getElementById("thinking");
        if (thinking) {
            thinking.remove();
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
            const response = await fetch("/chat", {
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
            console.log(` Response data:`, data);
            
            removeThinking();
            addMessage("atlas", data.response || "No response from server");

        } catch (error) {
            console.error("Chat error:", error);
            removeThinking();
            addMessage(
                "atlas",
                `Error: ${error.message}. Make sure the backend is running on http://127.0.0.1:8000`
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