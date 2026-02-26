 # MCQ System Architecture & Technical Specification

## 1. Executive Overview

This document defines the production-grade architecture for a scalable MCQ Solver + Generator System inspired by large-scale exam-prep platforms.

Target Scale: 10M+ users
System Type: Distributed, AI-augmented, microservices-ready

Primary Capabilities:
- Past paper ingestion (PDF upload)
- OCR + structured question extraction
- Topic classification
- MCQ solving with explanation
- MCQ generation (exam-style)
- Performance tracking & adaptive learning
- Agent-integrated tool execution

---

# 2. High-Level Architecture

User → API Gateway → MCQ Core Services → AI Layer → Database Layer → Analytics Layer

Core Services:
1. Ingestion Service
2. Extraction & Parsing Engine
3. Classification Service
4. MCQ Solver Service
5. MCQ Generator Service
6. Student Intelligence Engine
7. Analytics & Reporting Service

All services are stateless where possible and horizontally scalable.

---

# 3. System Components

## 3.1 API Gateway
Responsibilities:
- Authentication & Authorization (OAuth2 + JWT)
- Rate limiting
- Request routing
- Logging

Recommended:
- NGINX / Kong / AWS API Gateway

---

## 3.2 Authentication & Authorization

Features:
- OAuth2 with PKCE
- JWT access + refresh token rotation
- Role-Based Access Control (RBAC)

Roles:
- Student
- Teacher
- Admin
- Agent

---

## 3.3 Ingestion Service

Input:
- PDF upload

Pipeline:
1. File validation
2. Virus scan
3. Storage (Object Storage)
4. OCR trigger

Recommended Stack:
- Object Storage: S3-compatible
- Queue: Kafka / SQS
- OCR: Tesseract or Cloud Vision

Output:
Raw extracted text + layout metadata

---

## 3.4 Extraction & Parsing Engine

Goal:
Convert raw text into structured MCQ objects.

MCQ Object Schema:
{
  id: string,
  subject: string,
  topic: string,
  year: number,
  difficulty: string,
  question: string,
  options: [A, B, C, D],
  correctAnswer: string,
  explanation: string,
  source: string,
  embeddings: vector
}

Processing Steps:
1. Layout-aware parsing
2. Regex + ML hybrid detection
3. Option segmentation
4. Answer key linking
5. Confidence scoring

---

## 3.5 Classification Service

Tasks:
- Topic classification
- Difficulty estimation
- Exam board identification

Implementation:
- Embedding model
- Similarity search (Vector DB)

Vector DB Options:
- Pinecone
- Weaviate
- pgvector

---

## 3.6 MCQ Solver Service

Architecture: Retrieval-Augmented Generation (RAG)

Pipeline:
1. Receive MCQ
2. Retrieve relevant context
3. Generate reasoning steps
4. Produce answer
5. Generate explanation
6. Confidence score

Safeguards:
- Answer verification loop
- Hallucination detection
- Alternative reasoning check

---

## 3.7 MCQ Generator Service

Inputs:
- Topic
- Difficulty
- Exam style
- Bloom’s taxonomy level

Generation Flow:
1. Retrieve similar past questions
2. Extract structural pattern
3. Generate new question
4. Validate factual accuracy
5. Auto-solve for correctness
6. Quality scoring

---

## 3.8 Student Intelligence Engine

Capabilities:
- Performance tracking
- Weak topic detection
- Adaptive difficulty adjustment
- Spaced repetition scheduling
- Personalized question queue

Data Collected:
- Accuracy rate
- Time per question
- Topic mastery score
- Confidence trends

Algorithm Suggestions:
- Bayesian Knowledge Tracing
- Item Response Theory

---

## 3.9 Database Design

Relational DB:
- Users
- Questions
- Attempts
- Topics
- Exams

Vector DB:
- Embeddings for semantic retrieval

Cache Layer:
- Redis for:
  - Session storage
  - Rate limiting
  - Frequently accessed questions

---

# 4. Infrastructure & Scalability

Containerization:
- Docker

Orchestration:
- Kubernetes

Scaling Strategy:
- Horizontal Pod Autoscaling
- Read replicas for DB
- Separate worker nodes for OCR and AI tasks

CDN:
- Edge caching for static assets

---

# 5. Security Architecture

- mTLS between services
- Secrets via Vault
- Encrypted storage
- Input sanitization
- Rate limiting
- WAF integration
- Audit logging

---

# 6. Observability

- Structured logs
- Prometheus metrics
- Grafana dashboards
- Distributed tracing
- Alerting system

---

# 7. Agent Integration

MCQ services exposed as tools:

Tools:
- upload_paper
- extract_mcqs
- solve_mcq
- generate_mcq
- analyze_student

Agent communicates via internal API layer.

---

# 8. Deployment Strategy

Environment Stages:
- Dev
- Staging
- Production

CI/CD:
- Automated tests
- Security scans
- Container scanning
- Canary deployments

---

# 9. Future Enhancements

- AI proctoring mode
- Similarity detection
- Cheating detection
- Duplicate question detection
- Offline-first mobile mode

---

# 10. Non-Functional Requirements

- 99.9% uptime
- <300ms average API response time
- Scalable to 10M users
- GDPR compliant
- Encrypted backups

---

End of Specification v1

