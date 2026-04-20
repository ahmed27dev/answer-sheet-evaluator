import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    return (
      <div className="card">
        <h2>No Results Found</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Please submit an answer first.
        </p>
        <button className="btn" onClick={() => navigate('/evaluate')}>
          Go to Evaluate
        </button>
      </div>
    );
  }

  const getVerdict = (marks, max) => {
    const pct = marks / max;
    if (pct >= 0.8) return 'Excellent result';
    if (pct >= 0.6) return 'Good job, keep it up';
    if (pct >= 0.4) return 'Room for improvement';
    return 'Keep studying and try again';
  };

  return (
    <div>
      <div className="marks-box">
        <div className="label">Your Score</div>
        <div className="score">
          {data.marks} / {data.max_marks || 10}
        </div>
        <div className="verdict">
          {getVerdict(data.marks, data.max_marks || 10)}
        </div>
      </div>

      <div className="card">
        <h2>AI Feedback</h2>
        <div className="feedback-box">{data.feedback}</div>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={() => navigate('/evaluate')}>
          Evaluate Another
        </button>
        <button className="btn btn-dark" onClick={() => navigate('/history')}>
          View History
        </button>
      </div>
    </div>
  );
}

export default Results;
