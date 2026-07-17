<p align="center">
  <img src="https://raw.githubusercontent.com/ather-ops/atlas-agent/main/assets/logo.png" alt="Atlas Agent Logo" width="120">
</p>

<h1 align="center">Atlas Agent</h1>

<p align="center">
  <i>An autonomous AI assistant powered by smolagents.</i>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/ather-ops/atlas-agent/main/assets/cover.png" alt="Atlas Agent Cover">
</p>

---

## Overview

Atlas Agent is an autonomous AI assistant built with **smolagents** that can reason, plan, choose tools, execute actions, and solve real-world tasks.

Rather than acting like a traditional chatbot, Atlas is being developed as an intelligent automation platform capable of interacting with APIs, external services, local tools, and future AI systems.

The long-term vision is to build a production-ready AI agent that automates everyday workflows through modular tools and multi-step reasoning.

---

## Current Features

- Autonomous Agent Architecture
- Tool Calling using smolagents
- Hugging Face Inference Integration
- Environment Variable Management
- Modular Project Structure

### Built-in Tools

- Current Date & Time Tool
- System Information Tool
- Live Weather Tool (OpenWeather API)

---

## Tech Stack

- Python
- smolagents
- Hugging Face Inference API
- Gradio
- OpenWeather API
- python-dotenv
- Requests

---

## Development Progress

### Day 1
- Repository Setup
- Project Structure
- Virtual Environment
- Hugging Face Authentication
- smolagents Environment

### Day 2
- Built First Tool
- Date & Time Tool
- System Information Tool
- Live Weather Tool
- API Integration
- Environment Configuration

### Day 3
- Git Security Fixes
- Secret Management
- Repository Cleanup
- Stable Tool Architecture
- Foundation Ready for Agent Integration

---

## Roadmap

- [x] Repository Setup
- [x] Branding
- [x] smolagents Setup
- [x] Environment Configuration
- [x] Date & Time Tool
- [x] System Information Tool
- [x] Weather Tool

### Atlas v1

- [ ] Real CodeAgent
- [ ] Email Sender
- [ ] Gmail Integration
- [ ] Calendar Assistant
- [ ] Browser Search
- [ ] GitHub Assistant
- [ ] Slack Integration
- [ ] Notion Integration
- [ ] File Management
- [ ] RAG Memory
- [ ] Multi-Agent Architecture
- [ ] Gradio Interface

---

## Planned Integrations

- Gmail
- Google Calendar
- GitHub
- Slack
- Notion
- Browser Search
- Weather
- Local File System
- SQL Databases
- Vector Database
- RAG
- Custom APIs

---

## Architecture

```text
                User
                  │
                  ▼
           Atlas Agent
                  │
                  ▼
          Think • Reason
                  │
                  ▼
          Select Best Tool
                  │
                  ▼
          Execute Action
                  │
                  ▼
          Observe Result
                  │
                  ▼
         Final Response
```

---

## Project Structure

```text
atlas-agent/
│
├── assets/
│   ├── logo.png
│   └── cover.png
│
├── atlas/
│   ├── agent.py
│   ├── config.py
│   ├── tools.py
│   └── __init__.py
│
├── app.py
├── requirements.txt
├── .gitignore
├── .env
└── README.md
```

---

## Vision

Atlas Agent is a long-term engineering project focused on building a production-grade autonomous AI assistant.

Instead of demonstrating isolated AI features, Atlas is designed to combine reasoning, planning, tool usage, API integration, memory, retrieval, and multi-agent collaboration into one extensible platform.

Every development day expands Atlas with real capabilities while keeping the architecture clean, modular, and scalable.