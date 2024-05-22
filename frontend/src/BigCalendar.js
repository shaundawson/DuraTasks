import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

// Initialize moment localizer for consistent date handling
const localizer = momentLocalizer(moment);

function BigCalendarComponent() {
    const [events, setEvents] = useState([]); // State to store event data
    const [loading, setLoading] = useState(false); // State to indicate loading status

    // Fetch events from the backend on component mount
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
                    isTask: event.isTask || false, // Assume data includes isTask flag
                }));
                setEvents(formattedEvents);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
            setLoading(false);
        };

        fetchEvents();
    }, []);

    // Return the rendered Calendar component
    return (
        <div className="container mt-4">
            <h1 className="mb-4">Your Calendar</h1>
            {loading && <div className="alert alert-info">Loading...</div>}
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
            />
        </div>
    );
}

export default BigCalendarComponent;
