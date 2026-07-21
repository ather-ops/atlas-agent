const form = document.getElementById("form");
const input = document.getElementById("inp");
const messages = document.getElementById("msgs");
const body = document.getElementById("term-body");

function scrollBottom() {
    body.scrollTop = body.scrollHeight;
}

function addMessage(sender, text) {
    const wrapper = document.createElement("div");
    wrapper.className = "msg";
    const label = document.createElement("div");
    label.className = sender === "atlas"
        ? "msg-l at"
        : "msg-l";
    label.textContent = sender;

    const message = document.createElement("div");
    message.className = "msg-t";
    message.textContent = text;

    wrapper.appendChild(label);
    wrapper.appendChild(message);
    messages.appendChild(wrapper);
    scrollBottom();
}

function showThinking() {
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

function removeThinking() {
    const thinking = document.getElementById("thinking");
    if (thinking)
        thinking.remove();

}

form.addEventListener("submit", async function(e){
    e.preventDefault();
    const message = input.value.trim();
    if(message === "")
        return;
    addMessage("you", message);
    input.value = "";
    showThinking();

    try{
        const response = await fetch("/chat",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                message:message

            })

        });
        const data = await response.json();
        removeThinking();
        addMessage("atlas", data.response);

    }
    catch(error){
        removeThinking();
        addMessage(
            "atlas",
            "Unable to connect to Atlas backend."
        );
        console.error(error);

    }

});