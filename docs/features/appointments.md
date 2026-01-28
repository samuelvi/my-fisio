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
- **Offline Handling**: If an appointment creation or move fails due to network issues, a [Draft](draft-system.md) is saved, and the user is alerted. The UI optimistically updates but reverts if the server rejects the change.

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
