# Architecture

## Overview

This document describes the system architecture for the Goals project.

## Structure

The project is in its initial bootstrapping phase. Architecture details will be documented as components are added.

## Branch Strategy

```
dev (development) --> uat (staging) --> main (production)
```

- All automated changes land on `dev`
- Validated changes are promoted to `uat`
- Production releases go through PR review from `uat` to `main`

---

*Last updated: 2026-04-04*
