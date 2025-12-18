# Architecture Diagrams

This folder contains all 11 required architecture diagrams for Smart Solutions by TripleA.

## 📐 Diagrams Overview

### Main Report Diagrams (6)
1. **High-Level Architecture** - Hardware (Pi) + Software (Node) connection
2. **Use Case Diagram** - Admin vs. Operator scope
3. **Real-Time Sequence Diagram** - Event-Driven (WebSocket) logic
4. **Deployment Diagram** - Network setup
5. **UI Sitemap** - Platform scale
6. **User Journey Map** - Productivity problem solution

### Appendix Diagrams (5)
7. **Software Stack Diagram** - Layered view (Frontend/Backend/Data)
8. **Main Sequence Diagram** - System initialization & login flow
9. **Security Flowchart (RBAC)** - Login & role verification logic
10. **Image Optimization Activity Diagram** - Performance optimization logic
11. **Data Schema (JSON)** - Data structure documentation

## 🎨 How to Render Diagrams

### Using PlantText.com (Recommended)

1. Open [PlantText.com](https://www.planttext.com/)
2. Open `PLANTUML-DIAGRAMS.puml` file
3. Find the diagram you need (search for `@startuml Diagram-XX`)
4. Copy the entire diagram block (from `@startuml` to `@enduml`)
5. Paste into PlantText.com editor
6. Click "Generate" to render
7. Export as PNG or SVG

### Example: Rendering Diagram-01

```plantuml
@startuml Diagram-01-High-Level-Architecture
... (copy entire diagram code)
@enduml
```

## 📁 Files

- **PLANTUML-DIAGRAMS.puml** - All diagrams in one file (includes bonus Code Snippets diagram)
- **01-12-*.md** - Individual markdown documentation for required diagrams

## 📝 Diagram Index

| # | Diagram Name | File | PlantUML ID | Location |
|---|--------------|------|-------------|----------|
| 1 | High-Level Architecture | `01-High-Level-Architecture.md` | Diagram-01 | Main Report |
| 2 | Software Stack | `02-Software-Stack.md` | Diagram-02 | Appendix |
| 3 | Real-Time Sequence | `03-Sequence-Real-Time-Update.md` | Diagram-03 | Main Report |
| 4 | Image Optimization | `04-Activity-Image-Optimization.md` | Diagram-04 | Appendix |
| 5 | Security RBAC | `05-Security-RBAC.md` | Diagram-05 | Appendix |
| 6 | Data Schema | `06-Data-Schema.md` | Diagram-06 | Appendix |
| 7 | UI Sitemap | `07-UI-Sitemap.md` | Diagram-07 | Main Report |
| 8 | Deployment | `08-Deployment.md` | Diagram-08 | Main Report |
| 9 | Use Case | `10-Use-Case.md` | Diagram-10 | Main Report |
| 10 | User Journey Map | `11-User-Journey-Map.md` | Diagram-11 | Main Report |
| 11 | Main Sequence | `12-Main-Sequence-System-Init-Login.md` | Diagram-12 | Appendix |

---

**Total**: 11 required diagrams ✅ All complete and ready for thesis submission

**Note**: The PlantUML file also includes Diagram-09 (Code Snippets) as a bonus diagram, but it is not required for thesis submission.
