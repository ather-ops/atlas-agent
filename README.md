<p align="center">
  <img src="https://github.com/ather-ops/atlas-agent/blob/main/assets/Logo.png" alt="Atlas Agent Logo" width="120">
</p>

<h1 align="center">Atlas Agent</h1>

<p align="center">
  <i>An autonomous AI assistant powered by smolagents.</i>
</p>

<p align="center">
  <img src="https://github.com/ather-ops" alt="Atlas Agent Cover">
</p>

---

## Overview

Atlas Agent is an autonomous AI assistant built with **smolagents** that can reason, plan, select tools, execute actions, and solve real-world tasks.

Unlike a traditional chatbot, Atlas is designed as a modular AI agent capable of interacting with APIs, local files, Python code, and external services. The project focuses on building a production-oriented autonomous assistant through clean architecture, reusable tools, and intelligent reasoning.

The long-term vision is to transform Atlas into a complete AI productivity platform capable of automating real-world workflows.

---

## Current Features

- Autonomous AI Agent Architecture
- Tool Calling with smolagents
- Hugging Face Inference Integration
- Modular Python Architecture
- Environment Variable Management
- REST API Integration
- Local File Operations
- Live Internet Search
- Python Code Execution
- Production-Oriented Project Structure

### Built-in Tools

- Current Date & Time
- System Information
- Live Weather (OpenWeather API)
- Enhanced Calculator
- File Reader
- File Writer
- Web Search (Tavily API)
- Python Code Executor

---

## Tech Stack

- Python
- smolagents
- Hugging Face Inference API
- Tavily Search API
- OpenWeather API
- Requests
- python-dotenv
- Gradio
- Git
- GitHub

---

## Development Progress

### Day 1
- Repository Setup
- GitHub Workflow
- Project Structure
- Virtual Environment
- Hugging Face Configuration
- smolagents Setup

### Day 2
- Current Date & Time Tool
- System Information Tool
- Live Weather Tool
- OpenWeather API Integration
- Environment Configuration

### Day 3
- Git Secret Protection
- API Key Security
- .env Configuration
- Repository Cleanup
- Stable Project Architecture

### Day 4
- Enhanced Calculator Tool
- File Reader Tool
- Local File Handling
- Exception Handling
- Tool Validation

### Day 5
- File Writer Tool
- Tavily Web Search Tool
- Python Code Executor
- Calculator Improvements
- Atlas reached **8 working tools**

### Day 6
- Project Documentation Improvements
- Security Policy Added
- Repository Standardization
- Architecture Refinements
- Preparing CodeAgent Integration
- Atlas Alpha Backend Completed

---

## Roadmap

### Foundation

- [x] Repository Setup
- [x] Branding
- [x] Project Structure
- [x] Virtual Environment
- [x] smolagents Setup
- [x] Hugging Face Integration
- [x] Environment Configuration

### Core Tools

- [x] Date & Time Tool
- [x] System Information Tool
- [x] Weather Tool
- [x] Calculator Tool
- [x] File Reader Tool
- [x] File Writer Tool
- [x] Web Search Tool
- [x] Python Code Executor

---

## Atlas Alpha v1

- [ ] Connect Tools to CodeAgent
- [ ] Autonomous Tool Selection
- [ ] Multi-Step Reasoning
- [ ] HTML Chat Interface
- [ ] Interactive Web Demo
- [ ] UI Polish
- [ ] Alpha Release

---

## Planned Integrations

- Gmail
- Google Calendar
- GitHub
- Slack
- Notion
- Browser Automation
- SQL Databases
- Vector Database
- RAG
- Memory
- Multi-Agent Architecture

---

## Architecture

```text
                    User
                      │
                      ▼
                Atlas Agent
                      │
          ┌───────────┴───────────┐
          │      Think & Plan     │
          └───────────┬───────────┘
                      │
                      ▼
               Select Best Tool
                      │
 ┌────────┬────────┬────────┬────────┐
 ▼        ▼        ▼        ▼        ▼
Weather Search Files Python Calculator
                      │
                      ▼
               Execute Action
                      │
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
├── SECURITY.md
├── .gitignore
└── .env
```

---

## Current Status

**Version**

Atlas Alpha

**Working Tools**

- Current Date & Time
- System Information
- Live Weather
- Enhanced Calculator
- File Reader
- File Writer
- Web Search
- Python Code Executor

**Completed**

- 8 Production-Ready Tools
- API Integrations
- Security Configuration
- Modular Architecture
- Project Documentation

**Currently Building**

- smolagents CodeAgent Integration
- Autonomous Tool Selection
- HTML Chat Interface

---

## Vision

Atlas Agent is a long-term engineering project focused on building a production-grade autonomous AI assistant.

Rather than creating another chatbot, Atlas combines reasoning, planning, tool usage, API integrations, file operations, internet search, and Python execution into a single extensible platform.

Future releases will introduce memory, retrieval-augmented generation (RAG), browser automation, email workflows, GitHub integration, and multi-agent collaboration while maintaining a clean, scalable, and production-ready architecture.

---

## Repository Standards

Atlas follows modern software engineering practices.

- Modular Architecture
- Environment Variable Management
- GitHub Version Control
- Security Policy
- API Key Protection
- Clean Documentation
- Production-Oriented Structure

---

## License

This project is released under the MIT License.
