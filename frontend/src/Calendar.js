import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Button, Modal, Form, Tooltip, OverlayTrigger } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const localizer = momentLocalizer(moment);

function Calendar() {
    const [events, setEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({
        summary: '',
        start: { dateTime: '', timeZone: '' },
        end: { dateTime: '', timeZone: '' },
        location: '',
        description: '',
    });

    const myMessages = {
        agenda: "Schedule",  // Custom label for the agenda view
    };


    const [newTask, setNewTask] = useState({
        title: '',
        due: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showEventModal, setShowEventModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const timeZones = [
        'UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London',
        'Asia/Tokyo', 'Europe/Berlin', 'Australia/Sydney'
    ];

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await axios.get('https://127.0.0.1:5000/events', { withCredentials: true });
            if (response.headers['content-type'].includes('application/json')) {
                const formattedEvents = response.data.map(event => ({
                    id: event.id,
                    title: event.summary,
                    start: new Date(event.start.dateTime),
                    end: new Date(event.end.dateTime),
                    description: event.description,
                }));
                setEvents(formattedEvents);
            } else {
                console.error('Expected JSON response, received:', response.headers['content-type']);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            setMessage('Failed to fetch events. Please refresh the page to try again.');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('dateTime')) {
            const [field, subField] = name.split('.');
            const formattedValue = convertToUTC(value);
            setNewEvent(prev => ({
                ...prev,
                [field]: {
                    ...prev[field],
                    [subField]: formattedValue
                }
            }));
        } else if (name === 'timeZone') {
            setNewEvent(prev => ({
                ...prev,
                start: {
                    ...prev.start,
                    timeZone: value
                },
                end: {
                    ...prev.end,
                    timeZone: value // Syncing end timeZone with start
                }
            }));
        } else {
            setNewEvent(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleTaskInputChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    function convertToUTC(localDateTime) {
        const localDate = new Date(localDateTime);
        return localDate.toISOString();
    }

    const handleCreateEvent = async () => {
        setLoading(true);
        try {
            const response = await axios.post('https://127.0.0.1:5000/create_event', newEvent, { withCredentials: true });
            if (response.status === 201) {
                setMessage('Event created successfully!');
                fetchEvents();
                // Resetting the form state to initial state
                setNewEvent({
                    summary: '',
                    start: { dateTime: '', timeZone: '' },
                    end: { dateTime: '', timeZone: '' },
                    location: '',
                    description: '',
                });
                setShowEventModal(false); // Close modal after event creation
            } else {
                setMessage('Failed to create event. Please check your inputs.');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            setMessage('Error creating event. Check network and try again.');
        }
        setLoading(false);
    };

    const handleCreateTask = async () => {
        setLoading(true);
        try {
            const response = await axios.post('https://127.0.0.1:5000/create_task', newTask, { withCredentials: true });
            if (response.status === 201) {
                setMessage('Task created successfully!');
                // Resetting the form state to initial state
                setNewTask({
                    title: '',
                    due: '',
                    notes: ''
                });
                setShowTaskModal(false); // Close modal after task creation
            } else {
                setMessage('Failed to create task. Please check your inputs.');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            setMessage('Error creating task. Check network and try again.');
        }
        setLoading(false);
    };

    const onSelectEvent = event => {
        setSelectedEvent(event);
        setShowDeleteModal(true);
    };

    const deleteEvent = async () => {
        try {
            await axios.delete(`https://127.0.0.1:5000/events/${selectedEvent.id}`, { withCredentials: true });

            setShowDeleteModal(false);
            fetchEvents(); // Refresh the events after deletion
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    return (

        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Your Upcoming Events</h1>
                <div>
                    <Button variant="primary" className="me-2" onClick={() => setShowEventModal(true)}>
                        Create New Event
                    </Button>
                    <Button variant="secondary" onClick={() => setShowTaskModal(true)}>
                        Create New Task
                    </Button>
                </div>
            </div>
            {loading && <div className="alert alert-info">Loading...</div>}
            <BigCalendar
                localizer={localizer}
                events={events}
                onSelectEvent={onSelectEvent}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                // eventPropGetter={eventStyleGetter}
                messages={myMessages}
            />
            <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create a New Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {message && <div className="alert alert-warning">{message}</div>}
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Event Summary:</Form.Label>
                            <Form.Control type="text" name="summary" placeholder="Event Summary" onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Start Date and Time:</Form.Label>
                            <Form.Control type="datetime-local" name="start.dateTime" onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Time Zone:</Form.Label>
                            <Form.Select name="timeZone" onChange={handleInputChange}>
                                {timeZones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>End Date and Time:</Form.Label>
                            <Form.Control type="datetime-local" name="end.dateTime" onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Location:</Form.Label>
                            <Form.Control type="text" name="location" placeholder="Location" onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Event Description:</Form.Label>
                            <Form.Control as="textarea" name="description" rows={3} onChange={handleInputChange}></Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEventModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCreateEvent}>
                        Create Event
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this event?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={deleteEvent}>Delete</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create a New Task</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {message && <div className="alert alert-warning">{message}</div>}
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Task Title:</Form.Label>
                            <Form.Control type="text" name="title" placeholder="Task Title" onChange={handleTaskInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Due Date:</Form.Label>
                            <Form.Control type="date" name="due" onChange={handleTaskInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Notes:</Form.Label>
                            <Form.Control as="textarea" name="notes" rows={3} onChange={handleTaskInputChange}></Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCreateTask}>
                        Create Task
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Calendar;
