# DailyCare design rationale

DailyCare treats a resident’s day as one shared record. Each caregiver sees who they are, whose day they are working on, what earlier caregivers recorded, and which observations are due now.

The first screen keeps the usual state as text. No answer is selected for a fresh day. Items due now keep their choices visible. Once answered, they become compact summaries with the caregiver’s name and can be reopened. Future items carry a “Later today” label so an evening task does not appear missed in the morning.

The progress panel separates recorded answers, differences, answers due now, and items later today. A changed answer can open a short sheet for meal amount or a line of context. Shower and grooming have separate answers. Medication uses only given, not given, or refused.

Anna’s morning and midday entries and Maya’s evening entries form the same daily record in the example. Anna can save her part without sending to family. Maya sees Anna’s work, records her own observations, then reviews all entries. Missing answers have a direct way back and require an explicit “not recorded” decision before the simulated send.

The family view starts with a personal moment that actually exists in the record. It then shows what changed, what was not recorded, the care that was recorded, and the names of the caregivers who looked after the resident.

This is a visual and interactive prototype. Caregiver switching simulates a handover inside one browser session. Real accounts, shared storage between devices, conflict handling, and family delivery are not connected.
