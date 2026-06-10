// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// function History() {
//   const navigate = useNavigate();
//   const [evaluations, setEvaluations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchHistory();
//   }, []);

//   const fetchHistory = async () => {
//     try {
//       const response = await axios.get(
//         'http://127.0.0.1:8000/evaluate/history',
//       );
//       setEvaluations(response.data.evaluations);
//     } catch (err) {
//       setError('Could not load history. Is the backend running?');
//     }
//     setLoading(false);
//   };

//   const getBadgeClass = (type) => {
//     if (type === 'batch') return 'badge-image';
//     if (type === 'text') return 'badge-text';
//     return 'badge-text';
//   };

//   const getBadgeLabel = (type) => {
//     if (type === 'batch') return 'Image (Batch)';
//     if (type === 'text') return 'Text';
//     return type;
//   };

//   if (loading) {
//     return (
//       <div
//         className="spinner-wrap"
//         style={{ justifyContent: 'center', padding: '40px' }}
//       >
//         <div className="spinner"></div>
//         <span>Loading history...</span>
//       </div>
//     );
//   }

//   if (error) return <div className="error">{error}</div>;

//   if (evaluations.length === 0) {
//     return (
//       <div className="card">
//         <h2>No History Yet</h2>
//         <p style={{ color: '#666', marginBottom: '20px' }}>
//           No evaluations found. Submit an answer first.
//         </p>
//         <button className="btn" onClick={() => navigate('/evaluate')}>
//           Start Evaluating
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <h2
//         style={{
//           fontSize: '1.1rem',
//           fontWeight: 600,
//           color: '#1a1a2e',
//           marginBottom: '18px',
//         }}
//       >
//         Evaluation History
//       </h2>

//       {evaluations.map((item, index) => (
//         <div className="history-item" key={index}>
//           {/* ── Single text evaluation ── */}
//           {item.type === 'text' && (
//             <>
//               <div className="history-meta">
//                 <span className={`badge ${getBadgeClass(item.type)}`}>
//                   {getBadgeLabel(item.type)}
//                 </span>
//                 <span className="score-badge">
//                   {item.marks ?? '—'} / {item.max_marks ?? '—'}
//                 </span>
//               </div>
//               {item.question_text && (
//                 <div className="history-answer">
//                   <strong>Question:</strong> {item.question_text}
//                 </div>
//               )}
//               <div className="history-answer">
//                 <strong>Answer:</strong> {item.student_answer || '—'}
//               </div>
//               <div className="history-feedback">
//                 <strong>Feedback:</strong> {item.feedback || '—'}
//               </div>
//             </>
//           )}

//           {/* ── Batch image evaluation ── */}
//           {item.type === 'batch' && (
//             <>
//               <div className="history-meta">
//                 <span className={`badge ${getBadgeClass(item.type)}`}>
//                   {getBadgeLabel(item.type)}
//                 </span>
//                 <span className="score-badge">
//                   {item.total_marks ?? '—'} / {item.total_max ?? '—'}
//                 </span>
//               </div>

//               {/* ── ADDED: PRN display at top of each batch card ── */}
//               <div
//                 style={{
//                   display: 'inline-flex',
//                   alignItems: 'center',
//                   gap: '6px',
//                   backgroundColor: '#1a1a2e',
//                   color: '#ffffff',
//                   padding: '4px 14px',
//                   borderRadius: '20px',
//                   fontSize: '0.82rem',
//                   fontWeight: 700,
//                   marginBottom: '10px',
//                   marginTop: '4px',
//                 }}
//               >
//                 PRN: {item.prn || '—'}
//               </div>

//               {/* Per question results */}
//               {item.results && item.results.length > 0 && (
//                 <div style={{ marginTop: '10px' }}>
//                   {item.results.map((r, i) => (
//                     <div
//                       key={i}
//                       style={{
//                         background: '#f8f9fa',
//                         borderRadius: '8px',
//                         padding: '12px 14px',
//                         marginBottom: '8px',
//                         borderLeft: '3px solid #e94560',
//                       }}
//                     >
//                       <div
//                         style={{
//                           fontSize: '0.82rem',
//                           fontWeight: 700,
//                           color: '#1a1a2e',
//                           marginBottom: '4px',
//                         }}
//                       >
//                         Q{r.question_number} — {r.marks} / {r.max_marks} marks
//                       </div>
//                       <div
//                         style={{
//                           fontSize: '0.8rem',
//                           color: '#555',
//                           marginBottom: '4px',
//                         }}
//                       >
//                         <strong>Answer:</strong> {r.student_answer}
//                       </div>
//                       <div style={{ fontSize: '0.79rem', color: '#777' }}>
//                         <strong>Feedback:</strong> {r.feedback}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </>
//           )}

//           {/* ── Date ── */}
//           <div className="history-date" style={{ marginTop: '10px' }}>
//             {new Date(item.created_at).toLocaleString()}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default History;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function History() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(
        'http://127.0.0.1:8000/evaluate/history',
      );
      setEvaluations(response.data.evaluations);
    } catch (err) {
      setError('Could not load history. Is the backend running?');
    }
    setLoading(false);
  };

  // ── ADDED: Delete all history ──
  const deleteAllHistory = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete all evaluation history? This cannot be undone.',
      )
    )
      return;
    try {
      await axios.delete('http://127.0.0.1:8000/evaluate/history');
      setEvaluations([]);
    } catch (err) {
      setError('Could not delete history. Is the backend running?');
    }
  };

  const getBadgeClass = (type) => {
    if (type === 'batch') return 'badge-image';
    if (type === 'text') return 'badge-text';
    return 'badge-text';
  };

  const getBadgeLabel = (type) => {
    if (type === 'batch') return 'Image (Batch)';
    if (type === 'text') return 'Text';
    return type;
  };

  if (loading) {
    return (
      <div
        className="spinner-wrap"
        style={{ justifyContent: 'center', padding: '40px' }}
      >
        <div className="spinner"></div>
        <span>Loading history...</span>
      </div>
    );
  }

  if (error) return <div className="error">{error}</div>;

  if (evaluations.length === 0) {
    return (
      <div className="card">
        <h2>No History Yet</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          No evaluations found. Submit an answer first.
        </p>
        <button className="btn" onClick={() => navigate('/evaluate')}>
          Start Evaluating
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ── ADDED: Header with Delete All button ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
        }}
      >
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#1a1a2e',
            margin: 0,
          }}
        >
          Evaluation History
        </h2>
        <button
          onClick={deleteAllHistory}
          style={{
            backgroundColor: '#e94560',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 16px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🗑 Delete All
        </button>
      </div>

      {evaluations.map((item, index) => (
        <div className="history-item" key={index}>
          {/* ── Single text evaluation ── */}
          {item.type === 'text' && (
            <>
              <div className="history-meta">
                <span className={`badge ${getBadgeClass(item.type)}`}>
                  {getBadgeLabel(item.type)}
                </span>
                <span className="score-badge">
                  {item.marks ?? '—'} / {item.max_marks ?? '—'}
                </span>
              </div>
              {item.question_text && (
                <div className="history-answer">
                  <strong>Question:</strong> {item.question_text}
                </div>
              )}
              <div className="history-answer">
                <strong>Answer:</strong> {item.student_answer || '—'}
              </div>
              <div className="history-feedback">
                <strong>Feedback:</strong> {item.feedback || '—'}
              </div>
            </>
          )}

          {/* ── Batch image evaluation ── */}
          {item.type === 'batch' && (
            <>
              <div className="history-meta">
                <span className={`badge ${getBadgeClass(item.type)}`}>
                  {getBadgeLabel(item.type)}
                </span>
                <span className="score-badge">
                  {item.total_marks ?? '—'} / {item.total_max ?? '—'}
                </span>
              </div>

              {/* PRN display */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#1a1a2e',
                  color: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '10px',
                  marginTop: '4px',
                }}
              >
                PRN: {item.prn || '—'}
              </div>

              {/* Per question results */}
              {item.results && item.results.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {item.results.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '8px',
                        borderLeft: '3px solid #e94560',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#1a1a2e',
                          marginBottom: '4px',
                        }}
                      >
                        Q{r.question_number} — {r.marks} / {r.max_marks} marks
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#555',
                          marginBottom: '4px',
                        }}
                      >
                        <strong>Answer:</strong> {r.student_answer}
                      </div>
                      <div style={{ fontSize: '0.79rem', color: '#777' }}>
                        <strong>Feedback:</strong> {r.feedback}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Date ── */}
          <div className="history-date" style={{ marginTop: '10px' }}>
            {new Date(item.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

export default History;
