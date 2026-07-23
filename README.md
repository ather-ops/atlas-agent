<p align="center">
  <img src="https://github.com/ather-ops/atlas-agent/blob/main/assets/Cover.png" alt="Atlas Agent Cover" width="100%">
</p>

<h1 align="center">Atlas Agent</h1>

<h3 align="center">Autonomous AI Agent powered by FastAPI, Groq & smolagents</h3>

<p align="center">
  <b>Reason • Plan • Use Tools • Execute • Respond</b>
</p>

<p align="center">
  <a href="https://atlas-agent-xzve.onrender.com/"><b>Live Demo</b></a>
</p>

---

## Overview

Atlas Agent is an autonomous AI assistant built using **smolagents**, **FastAPI**, and **Groq**.

Unlike traditional chatbots, Atlas is designed to reason through tasks, decide which tool to use, execute that tool, and return an answer automatically — with minimal human guidance at each step.

The project focuses on building a production-ready AI assistant with a modular architecture, clean engineering practices, and an extensible tool system.

---

## Live Demo

Try Atlas Agent here: **[atlas-agent-xzve.onrender.com](https://atlas-agent-xzve.onrender.com/)**

---

## Current Features

- Autonomous AI agent with multi-step reasoning
- Automatic tool selection and execution
- FastAPI backend with a REST API
- Modern HTML/CSS/JavaScript frontend
- Groq LLM integration for fast inference
- Modular Python architecture
- Environment variable-based configuration

---

## Built-in Tools

| Tool | Description |
|------|-------------|
| Current Date & Time | Returns the current date and time |
| System Information | Reports system/environment details |
| Live Weather | Fetches real-time weather via OpenWeather |
| Calculator | Performs mathematical calculations |
| File Reader | Reads content from files |
| File Writer | Writes content to files |
| Web Search | Searches the web using Tavily |
| Python Code Execution | Executes Python code and returns results |

---

## Tech Stack

**Backend:** Python, FastAPI, Uvicorn, smolagents, Groq API
**Frontend:** HTML, CSS, JavaScript
**Integrations:** Tavily API, OpenWeather API
**Tooling:** python-dotenv, Git, GitHub

---

## Architecture

```text
                    User
                      │
                      ▼
                Atlas Frontend
                      │
                      ▼
                FastAPI Backend
                      │
                      ▼
                 Atlas Agent
                      │
         ┌────────────┴────────────┐
         │     Think & Reason      │
         └────────────┬────────────┘
                      │
               Select Best Tool
                      │
      ┌────────┬────────┬────────┬────────┐
      ▼        ▼        ▼        ▼        ▼
   Weather  Search   Files   Python  Calculator
                      │
                      ▼
                 Execute Tool
                      │
                      ▼
                 Final Response
```

---

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