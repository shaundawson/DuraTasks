import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { Button, Modal, Form } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';

// Sets up moment.js for date handling within the calendar
const localizer = momentLocalizer(moment);

function Calendar() {
    // State variables to store calendar data, form inputs, and UI state
    const [events, setEvents] = useState([]);
    const [currentView, setCurrentView] = useState('month'); // Default view of the calendar
    const [newEvent, setNewEvent] = useState({ summary: '', start: new Date(), end: new Date(), location: '', description: '' });
    const [newTask, setNewTask] = useState({ title: '', due: new Date(), notes: '' });
    const [selectedEvent, setSelectedEvent] = useState(null); // State for selected event
    const [loading, setLoading] = useState(false); // Indicates if the data is being loaded
    const [message, setMessage] = useState(''); // Feedback message for user actions
    const [showEventModal, setShowEventModal] = useState(false); // Controls visibility of the event creation modal
    const [showTaskModal, setShowTaskModal] = useState(false); // Controls visibility of the task creation modal
    const [showEditModal, setShowEditModal] = useState(false); // Controls visibility of the event edit modal
    const [showRecurrenceModal, setShowRecurrenceModal] = useState(false); // Controls visibility of the recurrence options modal

    // Fetch both events and tasks when the component mounts
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const fetchedEvents = await fetchEvents();
            const fetchedTasks = await fetchTasks();
            setEvents([...fetchedEvents, ...fetchedTasks]); // Combine events and tasks into one list
            setLoading(false);
        }
        fetchData();
    }, []);

    // Fetches events from the backend
    const fetchEvents = async () => {
        try {
            const response = await axios.get('https://127.0.0.1:5000/events', { withCredentials: true });
            if (response.data) {
                return response.data.map(event => ({
                    id: event.id,
                    title: event.summary,
                    start: new Date(event.start.dateTime),
                    end: new Date(event.end.dateTime),
                    description: event.description,
                    isTask: false,
                }));
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            setMessage('Failed to fetch events. Please refresh the page to try again.');
        }
        return [];
    };

    // Handles input changes for creating a new event
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewEvent(prev => ({ ...prev, [name]: value }));
    };

    // Handles date changes for creating a new event
    const handleEventDateChange = (date, field) => {
        setNewEvent(prev => ({ ...prev, [field]: date }));
    };

    // Creates a new event and sends it to the backend
    const handleCreateEvent = async () => {
        setLoading(true);
        try {
            const eventToCreate = {
                summary: newEvent.summary,
                location: newEvent.location,
                description: newEvent.description,
                start: {
                    dateTime: new Date(newEvent.start).toISOString(),
                    timeZone: 'America/New_York' // Adjust the timezone as needed
                },
                end: {
                    dateTime: new Date(newEvent.end).toISOString(),
                    timeZone: 'America/New_York' // Adjust the timezone as needed
                }
            };

            const response = await axios.post('https://127.0.0.1:5000/create_event', eventToCreate, { withCredentials: true });
            if (response.status === 201) {
                const newEvents = await fetchEvents();
                setEvents(newEvents);
                setShowEventModal(false);
                setMessage('Event created successfully!');
            } else {
                setMessage('Failed to create event. Please check your inputs.');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            setMessage('Error creating event. Check network and try again.');
        }
        setLoading(false);
    };

    // Handles input changes for editing an event
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setSelectedEvent(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handles date changes for editing an event
    const handleEditDateChange = (date, field) => {
        setSelectedEvent(prev => ({
            ...prev,
            [field]: date.toISOString()
        }));
    };

    // Updates an existing event and sends the updates to the backend
    const handleUpdateEvent = async (updateOption) => {
        setLoading(true);
        try {
            const eventToUpdate = {
                summary: selectedEvent.summary,
                location: selectedEvent.location,
                description: selectedEvent.description,
                start: {
                    dateTime: new Date(selectedEvent.start).toISOString(),
                    timeZone: 'America/New_York' // Adjust the timezone as needed
                },
                end: {
                    dateTime: new Date(selectedEvent.end).toISOString(),
                    timeZone: 'America/New_York' // Adjust the timezone as needed
                }
            };

            const response = await axios.put(`https://127.0.0.1:5000/update_event/${selectedEvent.id}?updateOption=${updateOption}`, eventToUpdate, { withCredentials: true });
            if (response.status === 200) {
                setMessage('Event updated successfully!');
                const updatedEvents = await fetchEvents();
                const updatedTasks = await fetchTasks();
                setEvents([...updatedEvents, ...updatedTasks]);
                setShowEditModal(false);
            } else {
                setMessage('Failed to update event. Please check your inputs.');
            }
        } catch (error) {
            console.error('Error updating event:', error);
            setMessage('Error updating event. Check network and try again.');
        }
        setLoading(false);
        setShowRecurrenceModal(false); // Close the recurrence modal
    };

    // Sets the selected event and opens the appropriate modal
    const handleSelectEvent = (event) => {
        setSelectedEvent({
            id: event.id,
            summary: event.title,
            start: new Date(event.start),
            end: new Date(event.end),
            location: event.location,
            description: event.description,
        });
        if (event.recurringEventId) {
            setShowRecurrenceModal(true); // Show recurrence options modal
        } else {
            setShowEditModal(true);
        }
    };

    // Deletes an event and updates the state
    const handleDeleteEvent = async () => {
        setLoading(true);
        try {
            const response = await axios.delete(`https://127.0.0.1:5000/events/${selectedEvent.id}`, { withCredentials: true });
            if (response.status === 200) {
                setMessage('Event deleted successfully!');
                const updatedEvents = await fetchEvents();
                const updatedTasks = await fetchTasks();
                setEvents([...updatedEvents, ...updatedTasks]);
                setShowEditModal(false);
            } else {
                setMessage('Failed to delete event. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            setMessage('Error deleting event. Check network and try again.');
        }
        setLoading(false);
    };

    // Fetches tasks from the backend
    const fetchTasks = async () => {
        try {
            const response = await axios.get('https://127.0.0.1:5000/tasks', { withCredentials: true });
            if (response.data) {
                return response.data.map(task => ({
                    id: task.id,
                    title: task.title,
                    start: new Date(task.due),
                    end: new Date(task.due),
                    allDay: true,
                    description: task.notes,
                    isTask: true,
                }));
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
        return [];
    };

    // Handles input changes for creating a new task
    const handleTaskInputChange = (event) => {
        const { name, value } = event.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    // Handles date changes for creating a new task
    const handleTaskDateChange = (date) => {
        setNewTask(prev => ({ ...prev, due: date }));
    };

    // Creates a new task and sends it to the backend
    const handleCreateTask = async () => {
        setLoading(true);
        try {
            const response = await axios.post('https://127.0.0.1:5000/create_task', newTask, { withCredentials: true });
            if (response.status === 201) {
                const newTasks = await fetchTasks();
                setEvents(prev => [...prev, ...newTasks]);
                setShowTaskModal(false);
                setMessage('Task created successfully!');
            } else {
                setMessage('Failed to create task. Please check your inputs.');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            setMessage('Error creating task. Check network and try again.');
        }
        setLoading(false);
    };

    // Handle view change in the calendar
    const handleViewChange = (newView) => {
        setCurrentView(newView);
    };

    // Determine the styles for each event or task on the calendar
    const eventStyleGetter = (event) => {
        if (currentView === 'agenda') {
            return {}; // No custom styles applied in 'agenda' view
        }
        // Apply custom colors based on whether the item is a task or an event
        const backgroundColor = event.isTask ? '#f0b400' : '#3174ad'; // Yellow for tasks, blue for events
        return {
            style: {
                backgroundColor,
                color: 'white',
                borderRadius: '0px',
                border: 'none'
            }
        };
    };

    // Render the calendar component along with modals for creating and editing events and tasks
    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Your Upcoming Events</h1>
                <div>
                    <Button variant="primary" onClick={() => setShowEventModal(true)}>Create New Event</Button>
                    <Button variant="secondary" onClick={() => setShowTaskModal(true)}>Create New Task</Button>
                </div>
            </div>
            {loading && <div className="alert alert-info">Loading...</div>}
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                onView={handleViewChange}
                view={currentView}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
            />
            {/* Modal for creating a new event */}
            <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create a New Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {message && <div className="alert alert-warning">{message}</div>}
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Event Summary</Form.Label>
                            <Form.Control type="text" name="summary" placeholder="Event Summary" onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Start Date and Time</Form.Label>
                            <DatePicker
                                selected={newEvent.start}
                                onChange={(date) => handleEventDateChange(date, 'start')}
                                showTimeSelect
                                dateFormat="Pp"
                                className="form-control"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>End Date and Time</Form.Label>
                            <DatePicker
                                selected={newEvent.end}
                                onChange={(date) => handleEventDateChange(date, 'end')}
                                showTimeSelect
                                dateFormat="Pp"
                                className="form-control"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Location</Form.Label>
                            <Form.Control type="text" name="location" placeholder="Location" onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Event Description</Form.Label>
                            <Form.Control as="textarea" name="description" rows={3} onChange={handleInputChange}></Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEventModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleCreateEvent}>Create Event</Button>
                </Modal.Footer>
            </Modal>
            {/* Modal for creating a new task */}
            <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create a New Task</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {message && <div className="alert alert-warning">{message}</div>}
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Task Title</Form.Label>
                            <Form.Control type="text" name="title" placeholder="Task Title" onChange={handleTaskInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Due Date</Form.Label>
                            <DatePicker
                                selected={newTask.due}
                                onChange={handleTaskDateChange}
                                dateFormat="Pp"
                                className="form-control"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control as="textarea" name="notes" rows={3} onChange={handleTaskInputChange}></Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTaskModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleCreateTask}>Create Task</Button>
                </Modal.Footer>
            </Modal>
            {/* Modal for editing an event */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {message && <div className="alert alert-warning">{message}</div>}
                    {selectedEvent && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Event Summary</Form.Label>
                                <Form.Control type="text" name="title" value={selectedEvent.title} onChange={handleEditInputChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date and Time</Form.Label>
                                <DatePicker
                                    selected={new Date(selectedEvent.start)}
                                    onChange={(date) => handleEditDateChange(date, 'start')}
                                    showTimeSelect
                                    dateFormat="Pp"
                                    className="form-control"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date and Time</Form.Label>
                                <DatePicker
                                    selected={new Date(selectedEvent.end)}
                                    onChange={(date) => handleEditDateChange(date, 'end')}
                                    showTimeSelect
                                    dateFormat="Pp"
                                    className="form-control"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Location</Form.Label>
                                <Form.Control type="text" name="location" value={selectedEvent.location} onChange={handleEditInputChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Event Description</Form.Label>
                                <Form.Control as="textarea" name="description" rows={3} value={selectedEvent.description} onChange={handleEditInputChange}></Form.Control>
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Close</Button>
                    <Button variant="danger" onClick={handleDeleteEvent}>Delete Event</Button>
                    <Button variant="primary" onClick={() => handleUpdateEvent('THIS_EVENT')}>Update Event</Button>
                </Modal.Footer>
            </Modal>
            {/* Modal for recurrence options */}
            <Modal show={showRecurrenceModal} onHide={() => setShowRecurrenceModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Update Recurring Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Would you like to update only this event, this and following events, or all events in the series?</p>
                    <Button variant="primary" onClick={() => handleUpdateEvent('THIS_EVENT')}>This Event</Button>
                    <Button variant="secondary" onClick={() => handleUpdateEvent('THIS_AND_FOLLOWING')}>This and Following Events</Button>
                    <Button variant="danger" onClick={() => handleUpdateEvent('ALL_EVENTS')}>All Events</Button>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default Calendar;
