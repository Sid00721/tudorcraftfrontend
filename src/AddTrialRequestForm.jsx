import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function AddTrialRequestForm({ onTrialRequestAdded, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [studentGrade, setStudentGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('trial_requests')
      .insert([
        { student_grade: studentGrade, subject: subject, location: location, preferred_time: preferredTime },
      ]);

    if (error) {
      alert('Error adding trial request: ' + error.message);
    } else {
      onTrialRequestAdded();
    }
    
    setLoading(false);
  };

  return (
    <div className="form-widget">
      <h3>Add New Trial Request</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="studentGrade">Student Grade</label>
          <input id="studentGrade" type="text" value={studentGrade} onChange={(e) => setStudentGrade(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="subject">Subject</label>
          <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="location">Location (Address or "Online")</label>
          <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="preferredTime">Preferred Date/Time</label>
          <input id="preferredTime" type="text" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
        </div>
        <div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Request'}
          </button>
          <button type="button" className="button button-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}