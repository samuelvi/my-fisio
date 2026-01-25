import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import Routing from '../routing/init';
import { Appointment } from '../types';
import StatusAlert from './shared/StatusAlert';

registerLocale('en', enUS);
registerLocale('es', es);

function toSimpleDateTimeString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

interface FormData {
    title: string;
    notes: string;
    type: string;
    startsAt: string;
    endsAt: string;
    allDay: boolean;
}

export default function Calendar() {
    const { t, language } = useLanguage();
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
    const [currentEvent, setCurrentEvent] = useState<any>(null);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [alertTitle, setAlertTitle] = useState<string>('');
    const [alertMessage, setAlertMessage] = useState<string>('');
    const calendarRef = useRef<FullCalendar>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<FormData>({
        title: '',
        notes: '',
        type: 'appointment',
        startsAt: '',
        endsAt: '',
        allDay: false
    });
    const [validationError, setValidationError] = useState<string | null>(null);
    const currentViewDatesRef = useRef<{ start: string | null; end: string | null }>({ start: null, end: null });
    const [hasAppointments, setHasAppointments] = useState<boolean>(false);
    const [hasEmptyGaps, setHasEmptyGaps] = useState<boolean>(false);
    const [isGeneratingGaps, setIsGeneratingGaps] = useState<boolean>(false);
    const [isDeletingGaps, setIsDeletingGaps] = useState<boolean>(false);
    const [showDeleteGapsConfirmModal, setShowDeleteGapsConfirmModal] = useState<boolean>(false);
    const [showDeleteGapsSuccessModal, setShowDeleteGapsSuccessModal] = useState<boolean>(false);
    const [gapsDeletedCount, setGapsDeletedCount] = useState<number>(0);
    const [showNoTypeConfirmModal, setShowNoTypeConfirmModal] = useState<boolean>(false);

    const MAX_DURATION = parseInt(import.meta.env.VITE_MAX_APPOINTMENT_DURATION || '10');
    const DEFAULT_DURATION_MINUTES = parseInt(import.meta.env.VITE_DEFAULT_APPOINTMENT_DURATION || '60');
    const SLOT_DURATION_MINUTES = parseInt(import.meta.env.VITE_CALENDAR_SLOT_DURATION_MINUTES || '15');
    const calendarFirstDay = parseInt(import.meta.env.VITE_CALENDAR_FIRST_DAY || '0', 10);
    const calendarScrollTime = import.meta.env.VITE_CALENDAR_SCROLL_TIME || '08:00:00';
    const narrowSaturday = import.meta.env.VITE_CALENDAR_NARROW_SATURDAY === 'true';
    const narrowSunday = import.meta.env.VITE_CALENDAR_NARROW_SUNDAY === 'true';
    const weekendWidthPercent = parseFloat(import.meta.env.VITE_CALENDAR_WEEKEND_WIDTH_PERCENT || '50');
    const slotDurationString = `00:${SLOT_DURATION_MINUTES.toString().padStart(2, '0')}:00`;
    const defaultDurationString = `00:${DEFAULT_DURATION_MINUTES.toString().padStart(2, '0')}:00`;
    const safeFirstDay = Number.isNaN(calendarFirstDay) || calendarFirstDay < 0 || calendarFirstDay > 6 ? 0 : calendarFirstDay as 0|1|2|3|4|5|6;
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
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 50);

            const handleEsc = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    setModalOpen(false);
                    calendarRef.current?.getApi()?.unselect();
                }
            };
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [modalOpen]);

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

        const start = new Date(formData.startsAt).getTime();
        const end = new Date(formData.endsAt).getTime();

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

    const getEventColors = (title: string | null, type: string | null) => {
        if (!title || title.trim() === '') {
            return { bg: 'rgb(245, 239, 224)', text: '#92400e' };
        }
        if (type === 'other') {
            return { bg: 'rgb(151, 160, 94)', text: '#ffffff' };
        }
        return { bg: 'rgb(160, 112, 94)', text: '#ffffff' };
    };

    const fetchEvents = useCallback(async (fetchInfo: any, successCallback: any, failureCallback: any) => {
        try {
            const startStr = fetchInfo.startStr.replace(/[+-]\d{2}:\d{2}|Z$/, '');
            const endStr = fetchInfo.endStr.replace(/[+-]\d{2}:\d{2}|Z$/, '');
            const currentView = calendarRef.current?.getApi()?.view?.type || 'timeGridWeek';

            currentViewDatesRef.current = { start: startStr, end: endStr };

            const response = await axios.get(Routing.generate('api_appointments_collection'), {
                params: {
                    start: startStr,
                    end: endStr,
                    view: currentView
                }
            });

            const data: Appointment[] = response.data['member'] || response.data['hydra:member'] || [];

            const hasEmptyGaps = data.some(app => !app.title || app.title.trim() === '');
            const hasAnyAppointments = data.length > 0;

            setHasEmptyGaps(hasEmptyGaps);
            setHasAppointments(hasAnyAppointments);

            const events = data.map(app => {
                const eventId = normalizeAppointmentId(app.id ?? app['@id']);
                const colors = getEventColors(app.title, app.type);
                return {
                    id: eventId ?? '',
                    title: app.title,
                    start: app.startsAt,
                    end: app.endsAt,
                    allDay: app.allDay,
                    extendedProps: {
                        notes: app.notes,
                        type: app.type,
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
    }, []); // Empty dependencies - function never changes

    const handleDateClick = (arg: any) => {
        if (!navigator.onLine) {
            handleApiError({ code: 'ERR_NETWORK' });
            return;
        }
        const calendarApi = arg.view.calendar;
        const start = arg.date;
        const end = new Date(start.getTime() + (DEFAULT_DURATION_MINUTES * 60000));

        calendarApi.select({
            start: start,
            end: end,
            allDay: arg.allDay
        });
    };

    const handleDateSelect = (selectInfo: any) => {
        if (!navigator.onLine) {
            handleApiError({ code: 'ERR_NETWORK' });
            return;
        }
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

    const handleEventClick = (clickInfo: any) => {
        if (!navigator.onLine) {
            handleApiError({ code: 'ERR_NETWORK' });
            return;
        }
        const app = clickInfo.event;
        setFormData({
            title: app.title || '',
            notes: app.extendedProps.notes || '',
            type: app.extendedProps.type || '',
            startsAt: app.startStr,
            endsAt: app.endStr,
            allDay: app.allDay
        });
        setCurrentEvent(app);
        setModalOpen(true);
    };

    const handleApiError = (error: any) => {
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
        
        if (isNetworkError) {
            setAlertTitle(t('connection_error'));
            setAlertMessage(t('connection_lost_msg'));
        } else {
            setAlertTitle(t('server_error'));
            const serverMsg = error.response?.data?.detail || error.response?.data?.['hydra:description'] || t('unexpected_server_error');
            setAlertMessage(serverMsg);
        }
        
        setShowAlert(true);
        setModalOpen(false);
        setIsDeleteConfirmOpen(false);
        setShowNoTypeConfirmModal(false);
    };

    const saveAppointment = async () => {
        try {
            const payload = { ...formData, userId: 1 };
            if (currentEvent) {
                const eventId = normalizeAppointmentId(currentEvent.id);
                if (!eventId) {
                    throw new Error('Missing appointment id for update');
                }
                await axios.put(Routing.generate('api_appointments_put', { id: eventId }), payload);
            } else {
                await axios.post(Routing.generate('api_appointments_post'), payload);
            }
            setModalOpen(false);
            setShowNoTypeConfirmModal(false);
            setShowAlert(false);
            if (calendarRef.current) calendarRef.current.getApi().refetchEvents();
        } catch (error: any) {
            console.error('Error saving appointment:', error);
            handleApiError(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validationError) return;
        if (!formData.type || formData.type === '') {
            setShowNoTypeConfirmModal(true);
            return;
        }
        await saveAppointment();
    };

    const handleDeleteConfirmed = async () => {
        if (!currentEvent) return;
        const eventId = normalizeAppointmentId(currentEvent.id);
        if (!eventId) {
            handleApiError({ response: { data: { detail: t('unexpected_server_error') } } });
            return;
        }
        try {
            await axios.delete(Routing.generate('api_appointments_delete', { id: eventId }));
            setModalOpen(false);
            setIsDeleteConfirmOpen(false);
            setShowAlert(false);
            if (calendarRef.current) calendarRef.current.getApi().refetchEvents();
        } catch (error: any) {
            console.error('Error deleting appointment:', error);
            handleApiError(error);
        }
    };

    const handleEventDrop = async (dropInfo: any) => {
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
            const eventId = normalizeAppointmentId(event.id);
            if (!eventId) {
                throw new Error('Missing appointment id for update');
            }
            await axios.put(Routing.generate('api_appointments_put', { id: eventId }), payload);
            setShowAlert(false);
        } catch (error: any) {
            console.error('Error moving appointment:', error);
            handleApiError(error);
            dropInfo.revert();
        }
    };

    const handleEventResize = async (resizeInfo: any) => {
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
            const eventId = normalizeAppointmentId(event.id);
            if (!eventId) {
                throw new Error('Missing appointment id for update');
            }
            await axios.put(Routing.generate('api_appointments_put', { id: eventId }), payload);
            setShowAlert(false);
        } catch (error: any) {
            console.error('Error resizing appointment:', error);
            handleApiError(error);
            resizeInfo.revert();
        }
    };

    const handleGenerateGaps = async () => {
        if (!currentViewDatesRef.current.start || !currentViewDatesRef.current.end) return;

        setIsGeneratingGaps(true);
        try {
            const response = await axios.post(Routing.generate('api_appointment_gaps_generate'), {
                start: currentViewDatesRef.current.start,
                end: currentViewDatesRef.current.end
            });

            calendarRef.current?.getApi()?.refetchEvents();

            if (response.data.warning) {
                alert(response.data.warning);
            }
        } catch (error: any) {
            console.error('Error generating gaps:', error);
            alert(error.response?.data?.error || 'Failed to generate empty gaps');
        } finally {
            setIsGeneratingGaps(false);
        }
    };

    const normalizeAppointmentId = (value: unknown): string | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') return String(value);
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return null;
            return trimmed.includes('/') ? trimmed.split('/').pop() || null : trimmed;
        }
        return null;
    };

    const handleDeleteGapsClick = () => {
        setShowDeleteGapsConfirmModal(true);
    };

    const handleDeleteEmptyGaps = async () => {
        if (!currentViewDatesRef.current.start || !currentViewDatesRef.current.end) return;

        setShowDeleteGapsConfirmModal(false);
        setIsDeletingGaps(true);
        try {
            const response = await axios.delete(Routing.generate('api_appointment_gaps_delete_empty'), {
                data: {
                    start: currentViewDatesRef.current.start,
                    end: currentViewDatesRef.current.end
                }
            });

            calendarRef.current?.getApi()?.refetchEvents();

            if (response.data.deletedCount > 0) {
                setGapsDeletedCount(response.data.deletedCount);
                setShowDeleteGapsSuccessModal(true);
            }
        } catch (error: any) {
            console.error('Error deleting empty gaps:', error);
            alert(error.response?.data?.error || 'Failed to delete empty gaps');
        } finally {
            setIsDeletingGaps(false);
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm h-full overflow-hidden relative border border-gray-200">
            <StatusAlert 
                show={showAlert} 
                onClose={() => setShowAlert(false)} 
                title={alertTitle}
                message={alertMessage}
            />
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('clinic_calendar')}</h2>
                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={handleGenerateGaps}
                        disabled={hasAppointments || isGeneratingGaps}
                        className={`px-4 py-2 rounded-md font-bold transition shadow-sm text-sm ${
                            hasAppointments || isGeneratingGaps
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        title={hasAppointments ? t('week_has_appointments') : t('generate_empty_gaps')}
                    >
                        {isGeneratingGaps ? t('generating') : t('generate_gaps')}
                    </button>
                    <button
                        onClick={handleDeleteGapsClick}
                        disabled={!hasEmptyGaps || isDeletingGaps}
                        className={`px-4 py-2 rounded-md font-bold transition shadow-sm text-sm ${
                            !hasEmptyGaps || isDeletingGaps
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                        title={!hasEmptyGaps ? t('no_empty_gaps') : t('delete_empty_gaps')}
                    >
                        {isDeletingGaps ? t('deleting') : t('delete_gaps')}
                    </button>
                    <button
                        onClick={() => {
                            if (!navigator.onLine) {
                                handleApiError({ code: 'ERR_NETWORK' });
                                return;
                            }
                            const now = new Date();
                            now.setMinutes(0, 0, 0);
                            now.setHours(now.getHours() + 1);
                            handleDateSelect({
                                startStr: toSimpleDateTimeString(now),
                                endStr: toSimpleDateTimeString(new Date(now.getTime() + (DEFAULT_DURATION_MINUTES * 60000))),
                                allDay: false
                            });
                        }}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-md font-bold transition shadow-sm"
                        data-testid="new-appointment-btn"
                    >
                        + {t('new_appointment')}
                    </button>
                </div>
            </div>

            <div className="calendar-container border rounded-lg overflow-hidden border-gray-100 shadow-sm">
                <FullCalendar
                    ref={calendarRef}
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
                                            <textarea rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 sm:px-8 flex justify-between items-center gap-4">
                                    <button type="button" onClick={() => { setModalOpen(false); calendarRef.current?.getApi()?.unselect(); }} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm transition">{t('cancel')}</button>
                                    <button
                                        type="submit"
                                        disabled={!!validationError}
                                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 text-base font-bold text-white sm:w-auto sm:text-sm transition ${validationError ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
                                        data-testid="save-appointment-btn"
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

            {showDeleteGapsConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('confirm')}</h3>
                        <p className="text-gray-700 mb-6">
                            {t('confirm_delete_empty_gaps') || 'Are you sure you want to delete all empty gaps?'}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteGapsConfirmModal(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-semibold transition"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleDeleteEmptyGaps}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition"
                            >
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteGapsSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-green-700 mb-4">✓ {t('confirm')}</h3>
                        <p className="text-gray-700 mb-6">
                            {gapsDeletedCount} {t('empty_gaps_deleted') || 'empty gaps deleted'}
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowDeleteGapsSuccessModal(false)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showNoTypeConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-amber-700 mb-4">⚠ {t('confirm')}</h3>
                        <p className="text-gray-700 mb-6">
                            {t('no_type_selected_warning') || "You haven't selected 'Appointment' or 'Other'. Do you want to save anyway?"}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowNoTypeConfirmModal(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-semibold transition"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={saveAppointment}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold transition"
                            >
                                {t('save_anyway') || 'Save Anyway'}
                            </button>
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
