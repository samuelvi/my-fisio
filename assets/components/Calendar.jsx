import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

export default function Calendar() {
    const [modalOpen, setModalOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [calendarRef, setCalendarRef] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        notes: '',
        type: 'appointment',
        startsAt: '',
        endsAt: '',
        allDay: false
    });

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
        setFormData({
            title: '',
            notes: '',
            type: 'appointment',
            startsAt: selectInfo.startStr,
            endsAt: selectInfo.endStr,
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

    return (
        <div className="bg-white p-6 rounded-lg shadow h-full overflow-hidden relative">
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Clinic Calendar</h2>
                <button 
                    onClick={() => {
                        const now = new Date();
                        handleDateSelect({ startStr: now.toISOString(), endStr: new Date(now.getTime() + 3600000).toISOString(), allDay: false });
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
                    events={fetchEvents} select={handleDateSelect} eventClick={handleEventClick} height="700px"
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
                                    <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4">
                                        {currentEvent ? 'Edit Appointment' : 'New Appointment'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Title</label>
                                            <input
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                                            <textarea rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">
                                        {currentEvent ? 'Update' : 'Create'}
                                    </button>
                                    {currentEvent && <button type="button" onClick={handleDelete} className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:mt-0 sm:w-auto sm:text-sm">Delete</button>}
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