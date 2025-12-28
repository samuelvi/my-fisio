import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { registerLocale } from 'react-datepicker';
import { enUS, es } from 'date-fns/locale';
import { useLanguage } from './LanguageContext';

registerLocale('en', enUS);
registerLocale('es', es);

// Convert Date to simple DATETIME format (no timezone)
function toSimpleDateTimeString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export default function Calendar() {
    const { t, language } = useLanguage();
    const [isMobile, setIsMobile] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
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
    const DEFAULT_DURATION_MINUTES = parseInt(import.meta.env.VITE_DEFAULT_APPOINTMENT_DURATION || 60);
    const SLOT_DURATION_MINUTES = parseInt(import.meta.env.VITE_CALENDAR_SLOT_DURATION_MINUTES || 15);
    const calendarFirstDay = parseInt(import.meta.env.VITE_CALENDAR_FIRST_DAY || '0', 10);
    const calendarScrollTime = import.meta.env.VITE_CALENDAR_SCROLL_TIME || '08:00:00';
    const narrowSaturday = import.meta.env.VITE_CALENDAR_NARROW_SATURDAY === 'true';
    const narrowSunday = import.meta.env.VITE_CALENDAR_NARROW_SUNDAY === 'true';
    const weekendWidthPercent = parseFloat(import.meta.env.VITE_CALENDAR_WEEKEND_WIDTH_PERCENT || '50');
    const slotDurationString = `00:${SLOT_DURATION_MINUTES.toString().padStart(2, '0')}:00`;
    const defaultDurationString = `00:${DEFAULT_DURATION_MINUTES.toString().padStart(2, '0')}:00`;
    const safeFirstDay = Number.isNaN(calendarFirstDay) || calendarFirstDay < 0 || calendarFirstDay > 6 ? 0 : calendarFirstDay;
    const calendarLocale = language === 'es' ? 'es' : 'en';
    const datePickerFormat = 'Pp';
    const safeWeekendPercent = Number.isNaN(weekendWidthPercent) ? 50 : Math.min(Math.max(weekendWidthPercent, 30), 100);
    const weekendColumnWidth = `${(100 / 7) * (safeWeekendPercent / 100)}%`;
    const weekendColumnStyles = (narrowSaturday || narrowSunday)
        ? `
                .fc .fc-scrollgrid,
                .fc .fc-scrollgrid table,
                .fc .fc-timegrid-cols table,
                .fc .fc-daygrid-body table {
                    table-layout: fixed;
                }
                ${narrowSaturday ? `
                .fc .fc-col-header-cell.fc-day-sat,
                .fc .fc-daygrid-day.fc-day-sat,
                .fc .fc-timegrid-col.fc-day-sat,
                .fc .fc-daygrid-body col.fc-day-sat,
                .fc .fc-timegrid-cols col.fc-day-sat {
                    width: ${weekendColumnWidth} !important;
                    min-width: 90px;
                }` : ''}
                ${narrowSunday ? `
                .fc .fc-col-header-cell.fc-day-sun,
                .fc .fc-daygrid-day.fc-day-sun,
                .fc .fc-timegrid-col.fc-day-sun,
                .fc .fc-daygrid-body col.fc-day-sun,
                .fc .fc-timegrid-cols col.fc-day-sun {
                    width: ${weekendColumnWidth} !important;
                    min-width: 90px;
                }` : ''}
            `
        : '';

    useEffect(() => {
        if (modalOpen) {
            // Small timeout to ensure DOM is ready
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 50);

            const handleEsc = (event) => {
                if (event.key === 'Escape') {
                    setModalOpen(false);
                    calendarRef?.getApi()?.unselect();
                }
            };
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [modalOpen, calendarRef]);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 768px)');
        const handleChange = () => setIsMobile(media.matches);
        handleChange();
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (!modalOpen) {
            setValidationError(null);
            return;
        }

        const start = new Date(formData.startsAt);
        const end = new Date(formData.endsAt);

        if (end <= start) {
            setValidationError(t('error_end_after_start'));
            return;
        }

        const diffHours = Math.abs(end - start) / 36e5;
        if (diffHours > MAX_DURATION) {
            setValidationError(`${t('error_max_duration')} ${MAX_DURATION} ${t('hours')}.`);
            return;
        }

        setValidationError(null);
    }, [formData.startsAt, formData.endsAt, modalOpen, MAX_DURATION, t]);

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
            // Get the current view type from the calendar instance
            const currentView = calendarRef?.getApi()?.view?.type || 'timeGridWeek';

            const response = await axios.get('/api/appointments', {
                params: {
                    start: fetchInfo.startStr,
                    end: fetchInfo.endStr,
                    view: currentView // Send the current view type (timeGridWeek, dayGridMonth, etc.)
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
                        type: app.type || 'appointment',
                        patientId: app.patientId ?? null
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

    const handleDateClick = (arg) => {
        const calendarApi = arg.view.calendar;
        const start = arg.date;
        const end = new Date(start.getTime() + (DEFAULT_DURATION_MINUTES * 60000));

        calendarApi.select({
            start: start,
            end: end,
            allDay: arg.allDay
        });
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

    const handleDeleteConfirmed = async () => {
        if (!currentEvent) return;
        try {
            await axios.delete(`/api/appointments/${currentEvent.id}`);
            setModalOpen(false);
            setIsDeleteConfirmOpen(false);
            if (calendarRef) calendarRef.getApi().refetchEvents();
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    };

    const handleEventDrop = async (dropInfo) => {
        const { event } = dropInfo;
        try {
            const safeEnd = event.end ?? new Date(event.start.getTime() + (DEFAULT_DURATION_MINUTES * 60000));
            const payload = {
                title: event.title,
                notes: event.extendedProps.notes,
                type: event.extendedProps.type,
                patientId: event.extendedProps.patientId ?? null,
                startsAt: toSimpleDateTimeString(event.start),
                endsAt: toSimpleDateTimeString(safeEnd),
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
            const safeEnd = event.end ?? new Date(event.start.getTime() + (DEFAULT_DURATION_MINUTES * 60000));
            const payload = {
                title: event.title,
                notes: event.extendedProps.notes,
                type: event.extendedProps.type,
                patientId: event.extendedProps.patientId ?? null,
                startsAt: toSimpleDateTimeString(event.start),
                endsAt: toSimpleDateTimeString(safeEnd),
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
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm h-full overflow-hidden relative border border-gray-200">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('clinic_calendar')}</h2>
                <button
                    onClick={() => {
                        const now = new Date();
                        // Round to next hour for cleaner start time
                        now.setMinutes(0, 0, 0);
                        now.setHours(now.getHours() + 1);
                        handleDateSelect({
                            startStr: toSimpleDateTimeString(now),
                            endStr: toSimpleDateTimeString(new Date(now.getTime() + (DEFAULT_DURATION_MINUTES * 60000))),
                            allDay: false
                        });
                    }}
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-md font-bold transition shadow-sm"
                >
                    + {t('new_appointment')}
                </button>
            </div>

            <div className="calendar-container border rounded-lg overflow-hidden border-gray-100 shadow-sm">
                <FullCalendar
                    ref={ref => setCalendarRef(ref)}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={
                        isMobile
                            ? { left: 'prev,next', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }
                            : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }
                    }
                    initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
                    locales={[esLocale]}
                    locale={calendarLocale}
                    firstDay={safeFirstDay}
                    scrollTime={calendarScrollTime}
                    editable={true} selectable={true} selectMirror={true} dayMaxEvents={true} weekends={true}
                    allDaySlot={false}
                    stickyHeaderDates={!isMobile}
                    height={isMobile ? 'auto' : '700px'}
                    slotDuration={slotDurationString}
                    snapDuration={slotDurationString}
                    defaultTimedEventDuration={defaultDurationString}
                    slotLabelInterval="01:00"
                    selectMinDistance={5}
                    dateClick={handleDateClick}
                    events={fetchEvents} select={handleDateSelect} eventClick={handleEventClick}
                    eventDrop={handleEventDrop} eventResize={handleEventResize}
                />
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => setModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-8 sm:pb-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl leading-6 font-bold text-gray-900">
                                            {currentEvent ? t('edit_appointment') : t('new_appointment')}
                                        </h3>
                                        {currentEvent && (
                                            <button
                                                type="button"
                                                onClick={() => setIsDeleteConfirmOpen(true)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                                title={t('delete')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('title')}</label>
                                            <input
                                                ref={titleInputRef}
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                placeholder={t('quick_slot_placeholder')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('type')}</label>
                                            <div className="flex space-x-4">
                                                <label className={`flex-1 flex items-center justify-center py-3 px-4 border rounded-md cursor-pointer transition ${formData.type === 'appointment' ? 'ring-2 ring-offset-1 ring-primary/50 border-transparent bg-[rgb(160,112,94)] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                                    <input type="radio" className="sr-only" value="appointment" checked={formData.type === 'appointment'} onChange={(e) => setFormData({...formData, type: e.target.value})}/>
                                                    <span className="text-xs font-bold uppercase tracking-wider">{t('appointment')}</span>
                                                </label>
                                                <label className={`flex-1 flex items-center justify-center py-3 px-4 border rounded-md cursor-pointer transition ${formData.type === 'other' ? 'ring-2 ring-offset-1 ring-primary/50 border-transparent bg-[rgb(151,160,94)] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                                    <input type="radio" className="sr-only" value="other" checked={formData.type === 'other'} onChange={(e) => setFormData({...formData, type: e.target.value})}/>
                                                    <span className="text-xs font-bold uppercase tracking-wider">{t('other')}</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('start')}</label>
                                                <DatePicker
                                                    selected={formData.startsAt ? new Date(formData.startsAt) : null}
                                                    onChange={(date) => setFormData({...formData, startsAt: date ? toSimpleDateTimeString(date) : ''})}
                                                    showTimeSelect
                                                    timeFormat="HH:mm"
                                                    timeIntervals={SLOT_DURATION_MINUTES}
                                                    dateFormat={datePickerFormat}
                                                    locale={calendarLocale}
                                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                    wrapperClassName="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('end')}</label>
                                                <DatePicker
                                                    selected={formData.endsAt ? new Date(formData.endsAt) : null}
                                                    onChange={(date) => setFormData({...formData, endsAt: date ? toSimpleDateTimeString(date) : ''})}
                                                    showTimeSelect
                                                    timeFormat="HH:mm"
                                                    timeIntervals={SLOT_DURATION_MINUTES}
                                                    dateFormat={datePickerFormat}
                                                    locale={calendarLocale}
                                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                    wrapperClassName="w-full"
                                                />
                                            </div>
                                        </div>
                                        {validationError && (
                                            <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded border border-red-100">
                                                {validationError}
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('notes')}</label>
                                            <textarea rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 sm:px-8 flex justify-between items-center gap-4">
                                    <button type="button" onClick={() => { setModalOpen(false); calendarRef?.getApi()?.unselect(); }} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm transition">{t('cancel')}</button>
                                    <button
                                        type="submit"
                                        disabled={!!validationError}
                                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 text-base font-bold text-white sm:w-auto sm:text-sm transition ${validationError ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
                                    >
                                        {currentEvent ? t('update') : t('create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => setIsDeleteConfirmOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-200">
                            <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">{t('delete')}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{t('confirm_delete_appointment')}</p>
                                        {currentEvent?.title && (
                                            <p className="text-sm font-bold text-gray-800 mt-2">{currentEvent.title}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteConfirmed}
                                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-bold text-white hover:bg-red-500 transition"
                                >
                                    {t('delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .fc .fc-button-primary { background-color: rgb(var(--color-primary)); border-color: rgb(var(--color-primary)); text-transform: uppercase; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; padding: 0.5rem 1rem; }
                .fc .fc-button-primary:hover { background-color: rgb(var(--color-primary-dark)); border-color: rgb(var(--color-primary-dark)); }
                .fc .fc-button-primary:disabled { background-color: #d1d5db; border-color: #d1d5db; color: #9ca3af; }
                .fc .fc-button-group > .fc-prev-button { margin-right: 0.35rem; }
                .fc .fc-button-group > .fc-next-button { margin-left: 0.35rem; }
                .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 800; color: #1f2937; }
                .fc-event { cursor: pointer; padding: 2px 4px; border-radius: 4px; border: none !important; }
                .fc-event-title { font-weight: 700; font-size: 0.8rem; }
                .fc-v-event { box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 3px solid rgba(0,0,0,0.1) !important; }
                .fc .fc-timegrid-slot { height: 2rem !important; }
                .fc .fc-timegrid-slot-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; }
                .fc-timegrid-event-harness-shadow .fc-timegrid-event,
                .fc-timegrid-bg-harness .fc-highlight,
                .fc-daygrid-bg-harness .fc-highlight,
                .fc-event-mirror {
                    background-color: rgba(var(--color-primary), 0.1) !important;
                    border: 2px dashed rgb(var(--color-primary)) !important;
                    opacity: 1;
                }
                .fc .fc-day-today { background-color: rgba(var(--color-primary), 0.05) !important; }
                ${weekendColumnStyles}
            `}} />
        </div>
    );
}
