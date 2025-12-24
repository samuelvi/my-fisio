import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';

export default function Calendar() {
    const [modalOpen, setModalOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [calendarRef, setCalendarRef] = useState(null);
    const titleInputRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        notes: '',
        type: 'appointment',
        startsAt: '',
        endsAt: '',
        allDay: false
    });
    const [validationError, setValidationError] = useState(null);
    const MAX_DURATION = parseInt(import.meta.env.VITE_MAX_APPOINTMENT_DURATION || 10);
    const DEFAULT_DURATION = parseInt(import.meta.env.VITE_DEFAULT_APPOINTMENT_DURATION || 1);
    const SLOT_DURATION_MINUTES = parseInt(import.meta.env.VITE_CALENDAR_SLOT_DURATION_MINUTES || 15);
    const slotDurationString = `00:${SLOT_DURATION_MINUTES.toString().padStart(2, '0')}:00`;

    useEffect(() => {
        if (modalOpen) {
            // Small timeout to ensure DOM is ready
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 50);
        }
    }, [modalOpen]);

    useEffect(() => {
        if (!modalOpen) {
            setValidationError(null);
            return;
        }
        
        const start = new Date(formData.startsAt);
        const end = new Date(formData.endsAt);
        
        if (end <= start) {
            setValidationError('End time must be after start time.');
            return;
        }

        const diffHours = Math.abs(end - start) / 36e5;
        if (diffHours > MAX_DURATION) {
            setValidationError(`Appointment cannot exceed ${MAX_DURATION} hours.`);
            return;
        }

        setValidationError(null);
    }, [formData.startsAt, formData.endsAt, modalOpen, MAX_DURATION]);

    const getEventColors = (title, type) => {
        if (!title || title.trim() === '') {
            return { bg: 'rgb(245, 239, 224)', text: '#92400e' }; // Yellow background, dark amber text
        }
        if (type === 'other') {
            return { bg: 'rgb(151, 160, 94)', text: '#ffffff' }; // Olive greenish
        }
        return { bg: 'rgb(160, 112, 94)', text: '#ffffff' }; // Brownish
    };

    const fetchEvents = async (fetchInfo, successCallback, failureCallback) => {
        try {
            const response = await axios.get('/api/appointments', {
                params: {
                    start: fetchInfo.startStr,
                    end: fetchInfo.endStr
                }
            });
            
            const data = response.data['member'] || response.data['hydra:member'] || [];
            const events = data.map(app => {
                const colors = getEventColors(app.title, app.type);
                return {
                    id: app.id,
                    title: app.title,
                    start: app.startsAt,
                    end: app.endsAt,
                    allDay: app.allDay,
                    extendedProps: {
                        notes: app.notes,
                        type: app.type || 'appointment'
                    },
                    backgroundColor: colors.bg,
                    borderColor: colors.bg,
                    textColor: colors.text
                };
            });
            
            successCallback(events);
        } catch (error) {
            console.error('Error fetching events:', error);
            failureCallback(error);
        }
    };

    const handleDateSelect = (selectInfo) => {
        const start = new Date(selectInfo.startStr);
        let end = new Date(selectInfo.endStr);
        
        // If it's a simple click (usually 30 mins in timeGrid), 
        // or if start and end are same, apply DEFAULT_DURATION
        const diffMs = end - start;
        if (diffMs <= 1800000) { // 30 mins or less
            end = new Date(start.getTime() + (DEFAULT_DURATION * 3600000));
        }

        setFormData({
            title: '',
            notes: '',
            type: 'appointment',
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
            allDay: selectInfo.allDay
        });
        setCurrentEvent(null);
        setModalOpen(true);
    };

    const handleEventClick = (clickInfo) => {
        const app = clickInfo.event;
        setFormData({
            title: app.title || '',
            notes: app.extendedProps.notes || '',
            type: app.extendedProps.type || 'appointment',
            startsAt: app.startStr,
            endsAt: app.endStr,
            allDay: app.allDay
        });
        setCurrentEvent(app);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (validationError) return;

        try {
            const payload = { ...formData, userId: 1 };
            if (currentEvent) {
                await axios.put(`/api/appointments/${currentEvent.id}`, payload);
            } else {
                await axios.post('/api/appointments', payload);
            }
            setModalOpen(false);
            if (calendarRef) calendarRef.getApi().refetchEvents();
        } catch (error) {
            console.error('Error saving appointment:', error);
        }
    };

    const handleDelete = async () => {
        if (!currentEvent || !window.confirm('Delete this appointment?')) return;
        try {
            await axios.delete(`/api/appointments/${currentEvent.id}`);
            setModalOpen(false);
            if (calendarRef) calendarRef.getApi().refetchEvents();
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    };

    const handleEventDrop = async (dropInfo) => {
        const { event } = dropInfo;
        try {
            const payload = {
                title: event.title,
                notes: event.extendedProps.notes,
                type: event.extendedProps.type,
                startsAt: event.start.toISOString(),
                endsAt: event.end ? event.end.toISOString() : null,
                allDay: event.allDay,
                userId: 1
            };
            await axios.put(`/api/appointments/${event.id}`, payload);
        } catch (error) {
            console.error('Error moving appointment:', error);
            dropInfo.revert();
        }
    };

    const handleEventResize = async (resizeInfo) => {
        const { event } = resizeInfo;
        try {
            const payload = {
                title: event.title,
                notes: event.extendedProps.notes,
                type: event.extendedProps.type,
                startsAt: event.start.toISOString(),
                endsAt: event.end ? event.end.toISOString() : null,
                allDay: event.allDay,
                userId: 1
            };
            await axios.put(`/api/appointments/${event.id}`, payload);
        } catch (error) {
            console.error('Error resizing appointment:', error);
            resizeInfo.revert();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow h-full overflow-hidden relative">
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Clinic Calendar</h2>
                <button 
                    onClick={() => {
                        const now = new Date();
                        // Round to next hour for cleaner start time
                        now.setMinutes(0, 0, 0);
                        now.setHours(now.getHours() + 1);
                        handleDateSelect({ 
                            startStr: now.toISOString(), 
                            endStr: new Date(now.getTime() + (DEFAULT_DURATION * 3600000)).toISOString(), 
                            allDay: false 
                        });
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-medium shadow-sm"
                >
                    + New Appointment
                </button>
            </div>
            
            <div className="calendar-container">
                <FullCalendar
                    ref={ref => setCalendarRef(ref)}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                    initialView="timeGridWeek"
                    editable={true} selectable={true} selectMirror={true} dayMaxEvents={true} weekends={true}
                    slotDuration={slotDurationString}
                    snapDuration={slotDurationString}
                    slotLabelInterval="01:00"
                    events={fetchEvents} select={handleDateSelect} eventClick={handleEventClick} 
                    eventDrop={handleEventDrop} eventResize={handleEventResize}
                    height="700px"
                />
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900">
                                            {currentEvent ? 'Edit Appointment' : 'New Appointment'}
                                        </h3>
                                        {currentEvent && (
                                            <button 
                                                type="button" 
                                                onClick={handleDelete} 
                                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                                title="Delete Appointment"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Title</label>
                                            <input
                                                ref={titleInputRef}
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                placeholder="Leave empty for quick slot"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                            <div className="flex space-x-4">
                                                <label className={`flex-1 flex items-center justify-center py-3 px-4 border rounded-md cursor-pointer transition ${formData.type === 'appointment' ? 'ring-2 ring-offset-1 ring-[rgb(160,112,94)] border-transparent bg-[rgb(160,112,94)] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                                    <input type="radio" className="sr-only" value="appointment" checked={formData.type === 'appointment'} onChange={(e) => setFormData({...formData, type: e.target.value})}/>
                                                    <span className="text-sm font-bold uppercase tracking-wide">Appointment</span>
                                                </label>
                                                <label className={`flex-1 flex items-center justify-center py-3 px-4 border rounded-md cursor-pointer transition ${formData.type === 'other' ? 'ring-2 ring-offset-1 ring-[rgb(151,160,94)] border-transparent bg-[rgb(151,160,94)] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                                    <input type="radio" className="sr-only" value="other" checked={formData.type === 'other'} onChange={(e) => setFormData({...formData, type: e.target.value})}/>
                                                    <span className="text-sm font-bold uppercase tracking-wide">Other</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                                                <DatePicker
                                                    selected={formData.startsAt ? new Date(formData.startsAt) : null}
                                                    onChange={(date) => setFormData({...formData, startsAt: date ? date.toISOString() : ''})}
                                                    showTimeSelect
                                                    timeFormat="HH:mm"
                                                    timeIntervals={SLOT_DURATION_MINUTES}
                                                    dateFormat="MMMM d, yyyy h:mm aa"
                                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    wrapperClassName="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                                                <DatePicker
                                                    selected={formData.endsAt ? new Date(formData.endsAt) : null}
                                                    onChange={(date) => setFormData({...formData, endsAt: date ? date.toISOString() : ''})}
                                                    showTimeSelect
                                                    timeFormat="HH:mm"
                                                    timeIntervals={SLOT_DURATION_MINUTES}
                                                    dateFormat="MMMM d, yyyy h:mm aa"
                                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    wrapperClassName="w-full"
                                                />
                                            </div>
                                        </div>
                                        {validationError && (
                                            <div className="text-red-600 text-sm font-medium">
                                                {validationError}
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                                            <textarea rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse items-center gap-2">
                                    <button 
                                        type="submit" 
                                        disabled={!!validationError}
                                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:w-auto sm:text-sm ${validationError ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    >
                                        {currentEvent ? 'Update' : 'Create'}
                                    </button>
                                    <button type="button" onClick={() => setModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .fc .fc-button-primary { background-color: #4f46e5; border-color: #4f46e5; text-transform: uppercase; font-size: 0.75rem; font-weight: 700; }
                .fc .fc-button-primary:hover { background-color: #4338ca; }
                .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; color: #111827; }
                .fc-event { cursor: pointer; padding: 2px 4px; border-radius: 4px; border: none !important; }
                .fc-event-title { font-weight: 600; font-size: 0.85rem; }
                .fc-v-event { box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
            `}} />
        </div>
    );
}