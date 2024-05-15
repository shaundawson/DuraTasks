import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

const localizer = momentLocalizer(moment);

function BigCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const response = await axios.get('https://127.0.0.1:5000/events', { withCredentials: true });
                const formattedEvents = response.data.map(event => ({
                    title: event.summary,
                    start: new Date(event.start.dateTime),
                    end: new Date(event.end.dateTime),
                    description: event.description,
                }));
                setEvents(formattedEvents);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
            setLoading(false);
        };

        fetchEvents();
    }, []);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Your Calendar</h1>
            {loading && <div className="alert alert-info">Loading...</div>}
            {!loading && (
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                />
            )}
        </div>
    );
}

export default BigCalendar;
