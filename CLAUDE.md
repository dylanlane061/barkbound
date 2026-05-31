# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Barkbound** is a dog-travel scouting and research platform. The core question it answers is: *"Is this place actually worth visiting with my dogs?"* It is not a route planner — users export candidates to tools like Roadtrippers or Google Maps after doing research here.

## Two-Layer Architecture

### Barkbound (Product Layer)
The user-facing application. Responsible for:
- Discovery of dog-friendly destinations, lodging, restaurants, and activities
- Scouting reports and candidate evaluation
- Trip research and export to external planning tools

### PawSignal (Intelligence Layer)
The underlying evidence aggregation and confidence scoring engine. This is the long-term technical moat. Responsible for:
- Ingesting data from multiple sources (OpenStreetMap, Recreation.gov, NPS, official websites, user imports)
- Normalizing raw data across heterogeneous sources
- Extracting dog-relevant signals (pet policies, size restrictions, leash rules, amenities)
- Producing transparent confidence scores with visible evidence chains

**Every recommendation in Barkbound is powered by PawSignal.**

### Data Flow

```
Data Sources → PawSignal (normalize → extract → score) → Barkbound (present → research → export)
```

## PawSignal Design Principles

These should guide all decisions in the intelligence layer:

- **Evidence First** — every conclusion must be backed by evidence; no fabricated scores
- **Source Agnostic** — no single data source is required; sources can be added/removed/replaced without breaking the system
- **Transparent Scoring** — users can always trace why a score exists; avoid black-box outputs
- **Confidence Over Certainty** — the system estimates confidence from available evidence; it does not claim to know the ground truth

## Key Distinction

PawSignal is not a recommendation engine in the traditional sense. It does not rank places by popularity or user preference. It evaluates the *quality and consistency of evidence* that a place is dog-friendly, then surfaces that evidence to the user for their own judgment.

The long-term asset is the **evidence graph** — the continuously growing structured knowledge of dog-relevant signals extracted from many sources — not the UI layer.
