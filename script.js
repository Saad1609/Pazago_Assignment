document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.querySelector(".chat-input input");
  const sendButton = document.querySelector(".send-btn");
  const chatArea = document.getElementById("chat-area");

  sendButton.addEventListener("click", async () => {
    const message = inputField.value.trim();
    if (!message) return;

    addMessage(message, "user");
    inputField.value = "";

    const apiUrl = "https://millions-screeching-vultur.mastra.cloud/api/agents/weatherAgent/stream";

    const botMessage = document.createElement("div");
    botMessage.classList.add("message", "assistant"); // Changed from "bot" to "assistant"
    botMessage.textContent = "Bot is typing...";
    chatArea.appendChild(botMessage);
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mastra-dev-playground": "true",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: message }],
          runId: "weatherAgent",
          maxRetries: 2,
          maxSteps: 5,
          temperature: 0.5,
          topP: 1,
          runtimeContext: {},
          threadId: 2,
          resourceId: "weatherAgent",
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}. Response: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullBotResponse = "";

      botMessage.textContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.length > 0);

        for (const line of lines) {
          const firstColonIndex = line.indexOf(':');
          if (firstColonIndex === -1) {
            console.warn("Unexpected line format (no colon):", line);
            continue;
          }

          const prefix = line.substring(0, firstColonIndex);
          let content = line.substring(firstColonIndex + 1);

          if (prefix === '0') {
            if (content.startsWith('"') && content.endsWith('"')) {
              content = content.substring(1, content.length - 1);
            }
            fullBotResponse += content;
          } else if (['f', '9', 'a', 'e', 'd'].includes(prefix)) {
            try {
              const jsonData = JSON.parse(content);
            } catch (jsonError) {
              console.warn(`Could not parse JSON from chunk with prefix ${prefix}:`, content, jsonError);
            }
          } else {
            console.warn("Unknown chunk prefix:", prefix, content);
          }
        }

        botMessage.textContent = fullBotResponse;
        chatArea.scrollTop = chatArea.scrollHeight;
      }

    } catch (error) {
      console.error("API Error:", error);
      botMessage.textContent = "❌ Something went wrong. Please try again.";
    }
  });

  function addMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);
    msgDiv.textContent = text;
    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
  }
});
