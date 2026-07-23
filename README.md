<p align="center">

# Atlas Agent

### Autonomous AI Agent powered by FastAPI, Groq & smolagents

**Reason • Plan • Use Tools • Execute • Respond**

🌐 **Live Demo:** https://atlas-agent-q9s3.onrender.com

</p>

---

# Overview

Atlas Agent is an autonomous AI assistant built using **smolagents**, **FastAPI**, and **Groq**.

Unlike traditional chatbots, Atlas is designed to **reason through tasks**, decide which tool to use, execute that tool, and return an answer automatically.

The project focuses on building a production-ready AI assistant with modular architecture, clean engineering practices, and extensible tools.

---

# Live Demo

**Atlas Agent Web App**

https://atlas-agent-q9s3.onrender.com

---

# Current Features

* Autonomous AI Agent
* Tool Calling
* Multi-step Reasoning
* FastAPI Backend
* Modern HTML/CSS/JavaScript Frontend
* Groq LLM Integration
* REST API
* Modular Python Architecture
* Environment Variable Management

---

# Built-in Tools

* Current Date & Time
* System Information
* Live Weather
* Calculator
* File Reader
* File Writer
* Web Search (Tavily)
* Python Code Execution

---

# Tech Stack

* Python
* FastAPI
* Groq API
* smolagents
* Tavily API
* OpenWeather API
* HTML
* CSS
* JavaScript
* python-dotenv
* Uvicorn
* Git
* GitHub

---

# Development Progress

## Day 1

* Repository Setup
* GitHub Workflow
* Project Structure
* Virtual Environment
* smolagents Setup

---

## Day 2

* Current Date Tool
* System Information Tool
* Weather Tool
* OpenWeather Integration

---

## Day 3

* API Security
* Environment Variables
* Secret Protection
* Repository Cleanup

---

## Day 4

* Calculator Tool
* File Reader
* Better Exception Handling

---

## Day 5

* File Writer
* Tavily Web Search
* Python Code Execution
* 8 Functional Tools

---

## Day 6

* Documentation
* Security Policy
* Project Standardization
* Backend Improvements

---

## Day 7

* Hugging Face → Groq Migration
* Faster Inference
* Agent Testing
* Tool Integration
* Stable Alpha Backend

---

## Day 8

* FastAPI Backend
* REST API
* HTML Landing Page
* Interactive Chat UI
* Frontend Architecture
* Backend API Testing

---

## Day 9

* Connected Frontend with FastAPI
* Live Chat Interface
* REST Communication using Fetch API
* Bug Fixes
* Render Deployment
* Public Live Demo
* Atlas Alpha v1 Released 🎉

---

# Roadmap

## Foundation

* [x] Repository Setup
* [x] Branding
* [x] Virtual Environment
* [x] FastAPI
* [x] Groq Integration
* [x] smolagents
* [x] Environment Configuration

---

## Core Tools

* [x] Current Time
* [x] System Information
* [x] Weather
* [x] Calculator
* [x] File Reader
* [x] File Writer
* [x] Web Search
* [x] Python Execution

---

## Atlas Alpha v1

* [x] CodeAgent
* [x] Autonomous Tool Selection
* [x] FastAPI Backend
* [x] HTML Frontend
* [x] Live Chat Interface
* [x] Public Deployment
* [x] Alpha Release

---

## Upcoming Features

* Research Agent
* Multi-source Search
* Citation Generation
* PDF Report Generation
* PowerPoint Generation
* Gmail Integration
* Google Calendar
* GitHub Assistant
* Browser Automation
* SQL Database Support
* Vector Database
* Memory
* Long-Term Memory
* Multi-Agent Collaboration
* Voice Interface

---

# Architecture

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

# Project Structure

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

# Current Status

## Version

**Atlas Alpha v1**

---

## Working Tools

* Date & Time
* System Information
* Weather
* Calculator
* File Reader
* File Writer
* Web Search
* Python Execution

---

## Completed

* Autonomous Agent
* FastAPI Backend
* Modern Frontend
* REST API
* Live Deployment
* Groq Integration
* 8 Production Tools
* Modular Architecture

---

## Live Demo

https://atlas-agent-q9s3.onrender.com

---

# Vision

Atlas Agent is a long-term engineering project focused on building a production-grade autonomous AI assistant.

Rather than becoming another chatbot, Atlas is evolving into an AI operating system capable of reasoning, selecting tools, automating workflows, generating reports, conducting research, executing code, and interacting with real-world services.

Future versions will introduce Research Agents, Memory, Browser Automation, Email Workflows, GitHub Integration, RAG, Multi-Agent Systems, and AI productivity features while maintaining a scalable, production-ready architecture.

---

# Repository Standards

* Modular Architecture
* Production-Oriented Structure
* FastAPI REST APIs
* Secure Environment Variables
* Clean Codebase
* GitHub Version Control
* MIT License
* Extensible Tool System

---

# License

Released under the **MIT License**.
