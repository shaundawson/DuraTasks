import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap CSS is imported

function TimeSlotSelector() {
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [taskDuration, setTaskDuration] = useState(60); // Default duration in minutes
    const [latestPossibleDate, setLatestPossibleDate] = useState('');
    const [priority, setPriority] = useState('medium'); // Default priority
    const [deadline, setDeadline] = useState('');
    const navigate = useNavigate();

    const fetchTimeSlots = useCallback(async () => {
        const validDuration = parseInt(taskDuration, 10);
        if (!Number.isInteger(validDuration)) {
            console.error('Invalid task duration:', taskDuration);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get('https://127.0.0.1:5000/suggest_time_slots', {
                params: {
                    duration: validDuration,
                    latestPossibleDate: latestPossibleDate,
                    priority: priority,
                    deadline: deadline
                },
                withCredentials: true
            });
            setTimeSlots(response.data.map(slot => ({
                start: new Date(slot[0]).toLocaleString(),
                end: new Date(slot[1]).toLocaleString()
            })));
        } catch (error) {
            console.error('Error fetching time slots:', error);
            setTimeSlots([]);
        } finally {
            setLoading(false);
        }
    }, [taskDuration, latestPossibleDate, priority, deadline]);

    useEffect(() => {
        if (latestPossibleDate && deadline) {
            fetchTimeSlots();
        }
    }, [latestPossibleDate, deadline, fetchTimeSlots]);

    const handleDateChange = event => {
        setLatestPossibleDate(event.target.value);
    };

    const handleDeadlineChange = event => {
        setDeadline(event.target.value);
    };

    const handleDurationChange = event => {
        setTaskDuration(event.target.value);
    };

    const handlePriorityChange = event => {
        setPriority(event.target.value);
    };

    const renderTooltip = (props, message) => (
        <Tooltip id="button-tooltip" {...props}>
            {message}
        </Tooltip>
    );

    return (
        <div className="container mt-3">
            <h2 className="mb-3">Select a Time Slot</h2>
            {loading ? (
                <div className="alert alert-info">Loading available times...</div>
            ) : (
                timeSlots.length > 0 ? (
                    <div>
                        <p>The slots you have available for this task are:</p>
                        <ul className="list-group">
                            {timeSlots.map((slot, index) => (
                                <li key={index} className="list-group-item">
                                    {slot.start} to {slot.end}
                                </li>
                            ))}
                        </ul>
                        <button className="btn btn-primary mt-3" onClick={() => navigate('/events')}>Back to Calendar</button>
                    </div>
                ) : <p>No available time slots.</p>
            )}
            <div className="form-group">
                <label>Task Duration (in minutes):</label>
                <input type="number" className="form-control" value={taskDuration} onChange={handleDurationChange} placeholder="Duration in minutes" />
            </div>
            <div className="form-group">
                <label htmlFor="latestPossibleDate">Latest Possible Date:</label>
                <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={renderTooltip("Select the latest possible date you would prefer for your task. This is not a hard deadline but the outer limit for planning.")}
                >
                    <input
                        type="date"
                        className="form-control"
                        id="latestPossibleDate"
                        value={latestPossibleDate}
                        onChange={handleDateChange}
                    />
                </OverlayTrigger>
            </div>
            <div className="form-group">
                <label htmlFor="deadline">Deadline:</label>
                <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={renderTooltip("Select the absolute final date by which the task must be completed.")}
                >
                    <input
                        type="date"
                        className="form-control"
                        id="deadline"
                        value={deadline}
                        onChange={handleDeadlineChange}
                    />
                </OverlayTrigger>
            </div>
            <div className="form-group">
                <label>Priority:</label>
                <select className="form-control" value={priority} onChange={handlePriorityChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
        </div>
    );
}

export default TimeSlotSelector;
