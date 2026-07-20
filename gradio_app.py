from atlas.agent import agent
import gradio as gr


def chat(message, history):
    try:
        return str(agent.run(message))
    except Exception as e:
        return str(e)


demo = gr.ChatInterface(
    fn=chat,
    title="Atlas Agent Alpha",
    description="Testing Atlas backend"
)

demo.launch(inbrowser=True)