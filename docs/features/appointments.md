# Appointment Scheduling Module

Interactive calendar system for managing clinic appointments and practitioner availability.

## Overview

The Appointment Scheduling module provides a visual interface for managing the daily operations of the clinic. It ensures efficient time management and prevents booking conflicts.

## Key Capabilities

### 1. Visual Calendar
- **Views**: Switch between Month, Week, and Day views.
- **Color Coding**:
    - **Blue**: Standard appointments.
    - **Gray**: "Other" events (meetings, blocks).
    - **Red**: Conflict or error states.
- **Drag & Drop**: Reschedule appointments by dragging them to a new slot (with instant backend sync).

### 2. Appointment Management
- **Quick Creation**: Click any empty slot to create a "Quick Appointment".
- **Detailed Editing**: Open any appointment to edit notes, duration, or patient details.
- **Conflict Detection**: The backend strictly prevents overlapping appointments for the same practitioner/room.

### 3. Gap Management
- **Empty Slot Detection**: Tools to identify and clear unused "gaps" in the schedule.
- **Bulk Operations**: "Delete Empty Gaps" to clean up the calendar view.

### 4. Resilience
- **Draft Recovery on Submit**: Appointment draft recovery is available only in the create/edit modal submit flow. The client pre-saves modal form data before submit, clears it on success, and marks it as error draft on network failure.
- **No Offline Queue for Calendar Interactions**: Drag/drop and resize keep the existing optimistic update + revert behavior on failure. No offline queue/replay is implemented in this module.

## User Workflows

### Scheduling an Appointment
1. Navigate to "Appointments".
2. Click on an available time slot.
3. **Quick Mode**: Enter a title/patient name and save.
4. **Detailed Mode**: Click "More Options" to set specific start/end times or add notes.

### Rescheduling
1. Drag an appointment from one slot to another.
2. Drop it.
3. System validates availability:
    - **Success**: Appointment stays in new slot.
    - **Failure**: Appointment snaps back to original slot, and an error alert appears.

### Draft Recovery in Modal (Create/Edit)
1. User opens appointment modal and fills fields.
2. User clicks save.
3. Modal form draft is pre-saved.
4. If save succeeds, draft is cleared.
5. If save fails due to network error, draft is marked as error draft and recovery alert is shown.
6. User can restore or discard draft from the calendar screen.

## Technical Details

### Backend Structure
- **Entity**: `App\Domain\Entity\Appointment`
- **Repository**: `App\Infrastructure\Persistence\Doctrine\Repository\DoctrineAppointmentRepository`
- **Controller**: `App\Infrastructure\Api\Controller\AppointmentController` (Custom gap logic)

### Frontend Components
- **Main View**: `assets/components/Calendar.tsx` (Wraps FullCalendar)
- **Helper**: `assets/utils/calendar.ts` (Date manipulation)

### Integration
- **FullCalendar**: Uses `@fullcalendar/react` for the visualization core.
- **API Platform**: Standard CRUD operations for persistence.
