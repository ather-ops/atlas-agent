<p align="center">
  <a href="https://github.com/ather-ops/atlas-agent/blob/main/assets/1000217390.mp4?raw=true">
    <img src="https://img.shields.io/badge/WATCH_DEMO_VIDEO-RED?style=for-the-badge&logo=video" alt="Watch Demo Video">
  </a>
  <br><br>
  <a href="https://github.com/ather-ops/atlas-agent/blob/main/assets/1000217390.mp4?raw=true">
    <img src="https://via.placeholder.com/1200x400/0d1117/ffffff?text=Atlas+Agent+Demo+-+Click+to+Watch" width="100%" alt="Atlas Agent Demo - Click to watch">
  </a>
  <br>
  <em>Click the banner above to watch the demo video</em>
</p>

<h1 align="center">Atlas Agent</h1>

<h3 align="center">Autonomous AI Agent powered by FastAPI, Groq & smolagents</h3>

<p align="center">
  <b>Reason • Plan • Use Tools • Execute • Respond</b>
</p>

<p align="center">
  <a href="https://atlas-agent-xzve.onrender.com/"><b>Live Demo</b></a>
  &nbsp;•&nbsp;
  <a href="#overview"><b>Overview</b></a>
  &nbsp;•&nbsp;
  <a href="#features"><b>Features</b></a>
  &nbsp;•&nbsp;
  <a href="#architecture"><b>Architecture</b></a>
  &nbsp;•&nbsp;
  <a href="#roadmap"><b>Roadmap</b></a>
</p>

---

## Demo Video

Watch Atlas Agent in action:

<p align="center">
  <a href="https://github.com/ather-ops/atlas-agent/blob/main/assets/1000217390.mp4?raw=true">
    <img src="https://via.placeholder.com/800x400/1a1a2e/ffffff?text=Click+to+Watch+Atlas+Agent+Demo" width="80%" alt="Click to watch demo">
  </a>
  <br>
  <em>Click the image to download or view the demo video</em>
</p>

What you'll see in the demo:
- Autonomous reasoning and tool selection
- Real-time weather information
- Web search capabilities
- Calculator and file operations
- Fast Groq-powered inference
- Interactive chat interface

---

## Overview

Atlas Agent is an autonomous AI assistant built using smolagents, FastAPI, and Groq.

Unlike traditional chatbots, Atlas is designed to reason through tasks, decide which tool to use, execute that tool, and return an answer automatically with minimal human guidance at each step.

The project focuses on building a production-ready AI assistant with a modular architecture, clean engineering practices, and an extensible tool system.

---

## Live Demo

Try Atlas Agent here: atlas-agent-xzve.onrender.com

---

## Features

- Autonomous AI agent with multi-step reasoning
- Automatic tool selection and execution
- FastAPI backend with a REST API
- Modern HTML/CSS/JavaScript frontend
- Groq LLM integration for fast inference
- Modular Python architecture
- Environment variable-based configuration
- Production-ready deployment

---

## Built-in Tools

| Tool | Description | Status |
|------|-------------|--------|
| Current Date & Time | Returns the current date and time | Active |
| System Information | Reports system/environment details | Active |
| Live Weather | Fetches real-time weather via OpenWeather | Active |
| Calculator | Performs mathematical calculations | Active |
| File Reader | Reads content from files | Active |
| File Writer | Writes content to files | Active |
| Web Search | Searches the web using Tavily | Active |
| Python Code Execution | Executes Python code and returns results | Active |

---

## Tech Stack

Backend: Python, FastAPI, Uvicorn, smolagents, Groq API

Frontend: HTML, CSS, JavaScript

Integrations: Tavily API, OpenWeather API

Tooling: python-dotenv, Git, GitHub

Deployment: Render

---

## Architecture

```text
                    User
                      |
                      v
                Atlas Frontend
                      |
                      v
                FastAPI Backend
                      |
                      v
                 Atlas Agent
                      |
         +------------+------------+
         |     Think & Reason      |
         +------------+------------+
                      |
               Select Best Tool
                      |
      +--------+--------+--------+--------+
      v        v        v        v        v
   Weather  Search   Files   Python  Calculator
                      |
                      v
                 Execute Tool
                      |
                      v
                 Final Response

## Project Structure

```text
atlas-agent/
├── atlas/
│   ├── __init__.py
│   ├── agent.py
│   ├── config.py
│   └── tools.py
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── chat.js
│
├── app.py
├── main.py
├── schemas.py
├── requirements.txt
├── README.md
├── SECURITY.md
├── .gitignore
└── .env
```

---

## Development Progress

| Day | Milestones |
|-----|------------|
| 1 | Repository setup, GitHub workflow, project structure, virtual environment, smolagents setup |
| 2 | Current date tool, system information tool, weather tool, OpenWeather integration |
| 3 | API security, environment variables, secret protection, repository cleanup |
| 4 | Calculator tool, file reader, better exception handling |
| 5 | File writer, Tavily web search, Python code execution — 8 functional tools |
| 6 | Documentation, security policy, project standardization, backend improvements |
| 7 | Migrated from Hugging Face to Groq for faster inference, agent testing, tool integration, stable alpha backend |
| 8 | FastAPI backend, REST API, HTML landing page, interactive chat UI, frontend architecture, backend API testing |
| 9 | Connected frontend with FastAPI, live chat interface, REST communication via Fetch API, bug fixes, Render deployment, public live demo — Atlas Alpha v1 released |

---

## Roadmap

### Foundation
- [x] Repository setup
- [x] Branding
- [x] Virtual environment
- [x] FastAPI
- [x] Groq integration
- [x] smolagents
- [x] Environment configuration

### Core Tools
- [x] Current time
- [x] System information
- [x] Weather
- [x] Calculator
- [x] File reader
- [x] File writer
- [x] Web search
- [x] Python execution

### Atlas Alpha v1
- [x] CodeAgent
- [x] Autonomous tool selection
- [x] FastAPI backend
- [x] HTML frontend
- [x] Live chat interface
- [x] Public deployment
- [x] Alpha release

### Upcoming Features
- [ ] Research agent
- [ ] Multi-source search
- [ ] Citation generation
- [ ] PDF report generation
- [ ] PowerPoint generation
- [ ] Gmail integration
- [ ] Google Calendar
- [ ] GitHub assistant
- [ ] Browser automation
- [ ] SQL database support
- [ ] Vector database
- [ ] Memory
- [ ] Long-term memory
- [ ] Multi-agent collaboration
- [ ] Voice interface

---

## Current Status

**Version:** Atlas Alpha v1

**Working Tools:** Date & Time, System Information, Weather, Calculator, File Reader, File Writer, Web Search, Python Execution

**Completed:**
- Autonomous agent
- FastAPI backend
- Modern frontend
- REST API
- Live deployment
- Groq integration
- 8 production tools
- Modular architecture

**Live Demo:** [atlas-agent-xzve.onrender.com](https://atlas-agent-xzve.onrender.com/)

---

## Vision

Atlas Agent is a long-term engineering project focused on building a production-grade autonomous AI assistant.

Rather than becoming another chatbot, Atlas is evolving into an AI operating system capable of reasoning, selecting tools, automating workflows, generating reports, conducting research, executing code, and interacting with real-world services.

Future versions will introduce research agents, memory, browser automation, email workflows, GitHub integration, RAG, multi-agent systems, and other AI productivity features, all while maintaining a scalable, production-ready architecture.

---

## Repository Standards

- Modular architecture
- Production-oriented structure
- FastAPI REST APIs
- Secure environment variables
- Clean codebase
- GitHub version control
- MIT License
- Extensible tool system

---

## License

Released under the **MIT License**.
