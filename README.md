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

Instead of acting as a traditional chatbot, Atlas is being developed as an intelligent automation platform capable of interacting with APIs, local files, external services, and future AI systems.

The long-term goal is to build a production-ready AI agent that automates everyday workflows through modular tools, multi-step reasoning, and scalable architecture.

---

## Current Features

- Autonomous Agent Architecture
- Tool Calling with smolagents
- Hugging Face Inference Integration
- Environment Variable Management
- Modular Python Architecture
- REST API Integration
- Local File Operations

### Built-in Tools

- Current Date & Time
- System Information
- Live Weather (OpenWeather API)
- Calculator
- File Reader

---

## Tech Stack

- Python
- smolagents
- Hugging Face Inference API
- OpenWeather API
- Gradio
- Requests
- python-dotenv

---

## Development Progress

### Day 1
- Repository Setup
- GitHub Workflow
- Project Structure
- Virtual Environment
- Hugging Face Configuration
- smolagents Environment

### Day 2
- Date & Time Tool
- System Information Tool
- Live Weather Tool
- OpenWeather API Integration
- Environment Configuration

### Day 3
- Git Secret Protection
- .env Security
- Repository Cleanup
- Stable Project Architecture
- API Configuration Improvements

### Day 4
- Calculator Tool
- File Reader Tool
- Local File Handling
- Exception Handling
- Tool Testing & Validation
- Atlas now has **5 working tools**

---

## Roadmap

### Core Foundation

- [x] Repository Setup
- [x] Branding
- [x] Project Structure
- [x] smolagents Setup
- [x] Hugging Face Integration
- [x] Environment Configuration

### Current Tools

- [x] Date & Time Tool
- [x] System Information Tool
- [x] Weather Tool
- [x] Calculator Tool
- [x] File Reader Tool
- [ ] File Writer Tool
- [ ] Web Search Tool
- [ ] Folder Reader Tool

---

## Atlas v1

- [ ] Connect all tools to CodeAgent
- [ ] Autonomous Tool Selection
- [ ] HTML Chat Interface
- [ ] Email Automation
- [ ] Browser Search
- [ ] File Management
- [ ] Stable Agent Workflow
- [ ] Atlas v1 Release

---

## Future Integrations

- Gmail
- Google Calendar
- GitHub
- Slack
- Notion
- Browser Automation
- Weather
- Local File System
- SQL Databases
- Vector Database
- RAG
- Multi-Agent System

---

## Architecture

```text
                 User
                   │
                   ▼
             Atlas Agent
                   │
         ┌─────────┴─────────┐
         │   Think & Reason  │
         └─────────┬─────────┘
                   │
                   ▼
            Select Best Tool
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
   Weather     Calculator   File Reader
        │          │          │
        └──────────┼──────────┘
                   ▼
             Observation
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
│   ├── __init__.py
│   ├── agent.py
│   ├── config.py
│   └── tools.py
│
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
└── .env
```

---

## Vision

Atlas Agent is a long-term engineering project focused on building a production-grade autonomous AI assistant.

Rather than creating another chatbot, Atlas is designed to become an intelligent agent capable of reasoning, planning, selecting tools, interacting with APIs, managing files, retrieving knowledge, and automating real-world workflows.

Each development day adds practical capabilities while maintaining a clean, modular, and scalable architecture.

---

## Current Status

**Version:** Pre-Alpha

**Working Tools:** 5

- Date & Time
- System Information
- Weather
- Calculator
- File Reader

**Next Milestone:** Connect all tools to a real `smolagents` CodeAgent and launch the first interactive Atlas interface.