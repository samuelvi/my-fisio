import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

export default function Calendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get('/api/appointments');
            const data = response.data['member'] || response.data['hydra:member'] || [];
            
            const mappedEvents = data.map(app => ({
                id: app.id,
                title: app.title || (app.patientName ? `Appt: ${app.patientName}` : 'Appt: (No patient)'),
                start: app.startsAt,
                end: app.endsAt,
                allDay: app.allDay,
                extendedProps: {
                    patientId: app.patientId,
                    patientName: app.patientName,
                    notes: app.notes
                }
            }));
            setEvents(mappedEvents);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setLoading(false);
        }
    };

    const handleDateSelect = (selectInfo) => {
        const title = prompt('Please enter a new title for your appointment');
        const calendarApi = selectInfo.view.calendar;
        calendarApi.unselect();

        if (title) {
            console.log('Would save:', {
                title,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                allDay: selectInfo.allDay
            });
        }
    };

    const handleEventClick = (clickInfo) => {
        alert(`Appointment: ${clickInfo.event.title}\nPatient: ${clickInfo.event.extendedProps.patientName || '(No patient)'}\nNotes: ${clickInfo.event.extendedProps.notes || 'None'}`);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow h-full overflow-hidden">
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Clinic Calendar</h2>
                <button 
                    onClick={() => alert('New Appointment modal coming soon')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-medium"
                >
                    + New Appointment
                </button>
            </div>
            
            <div className="calendar-container">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    initialView="timeGridWeek"
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    events={events}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    height="700px"
                />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .fc .fc-button-primary {
                    background-color: #4f46e5;
                    border-color: #4f46e5;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }
                .fc .fc-button-primary:hover {
                    background-color: #4338ca;
                    border-color: #4338ca;
                }
                .fc .fc-toolbar-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #111827;
                }
                .fc-event {
                    cursor: pointer;
                }
            `}} />
        </div>
    );
}
