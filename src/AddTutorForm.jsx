import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function AddTutorForm({ onTutorAdded, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [suburb, setSuburb] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('tutors')
      .insert([
        { full_name: fullName, email: email, phone_number: phone, suburb: suburb },
      ]);

    if (error) {
      alert('Error adding tutor: ' + error.message);
    } else {
      // This function is passed from the Dashboard to tell it to refresh the data
      onTutorAdded(); 
    }
    
    setLoading(false);
  };

  return (
    <div className="form-widget">
      <h3>Add New Tutor</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName">Full Name</label>
          <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="phone">Phone Number</label>
          <input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="suburb">Suburb</label>
          <input id="suburb" type="text" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
        </div>
        <div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Tutor'}
          </button>
          <button type="button" className="button button-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}