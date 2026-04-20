// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// function Evaluate() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('text');
//   const [answer, setAnswer] = useState('');
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const [questions, setQuestions] = useState([]);
//   const [questionId, setQuestionId] = useState('');
//   const [loadingQuestions, setLoadingQuestions] = useState(true);

//   // ── Fetch questions for dropdown ──
//   useEffect(() => {
//     const fetchQuestions = async () => {
//       try {
//         const res = await axios.get('http://127.0.0.1:8000/questions/');
//         setQuestions(res.data.questions || []);
//         if (res.data.questions?.length > 0) {
//           setQuestionId(res.data.questions[0].id);
//         }
//       } catch {
//         setError(
//           'Could not load questions. Add one in the Question Bank first.',
//         );
//       }
//       setLoadingQuestions(false);
//     };
//     fetchQuestions();
//   }, []);

//   const handleSubmit = async () => {
//     setError('');

//     if (!questionId) {
//       setError('Please select a question first.');
//       return;
//     }

//     setLoading(true);

//     try {
//       let response;

//       if (mode === 'text') {
//         if (!answer.trim()) {
//           setError('Please enter your answer.');
//           setLoading(false);
//           return;
//         }
//         const formData = new FormData();
//         formData.append('question_id', questionId);
//         formData.append('answer', answer);
//         response = await axios.post(
//           'http://127.0.0.1:8000/evaluate/text',
//           formData,
//         );
//       } else {
//         if (!file) {
//           setError('Please upload an image.');
//           setLoading(false);
//           return;
//         }
//         const formData = new FormData();
//         formData.append('question_id', questionId);
//         formData.append('file', file);
//         response = await axios.post(
//           'http://127.0.0.1:8000/evaluate/image',
//           formData,
//         );
//       }

//       navigate('/results', { state: response.data });
//     } catch (err) {
//       setError('Something went wrong. Is the backend running?');
//     }

//     setLoading(false);
//   };

//   // ── Selected question details ──
//   const selectedQuestion = questions.find((q) => q.id === questionId);

//   return (
//     <div className="card">
//       <h2>Evaluate Answer</h2>

//       {/* Question Selector */}
//       <label>Select Question</label>
//       {loadingQuestions ? (
//         <p style={{ fontSize: '13px', color: '#888' }}>Loading questions...</p>
//       ) : questions.length === 0 ? (
//         <div className="error">
//           No questions found. Go to{' '}
//           <a href="/questions" style={{ color: '#e8342a' }}>
//             Question Bank
//           </a>{' '}
//           and add one first.
//         </div>
//       ) : (
//         <select
//           value={questionId}
//           onChange={(e) => setQuestionId(e.target.value)}
//           style={{
//             width: '100%',
//             padding: '10px 14px',
//             fontSize: '14px',
//             border: '1px solid #ddd',
//             borderRadius: '10px',
//             marginBottom: '8px',
//             outline: 'none',
//             fontFamily: 'inherit',
//             background: '#fff',
//           }}
//         >
//           {questions.map((q) => (
//             <option key={q.id} value={q.id}>
//               [{q.subject}] {q.question_text}
//             </option>
//           ))}
//         </select>
//       )}

//       {/* Show selected question details */}
//       {selectedQuestion && (
//         <div
//           style={{
//             background: '#fafafa',
//             border: '1px solid #eee',
//             borderRadius: '10px',
//             padding: '12px 16px',
//             marginBottom: '20px',
//             fontSize: '13px',
//             color: '#555',
//           }}
//         >
//           Max marks: <strong>{selectedQuestion.max_marks}</strong>
//         </div>
//       )}

//       {/* Mode Toggle */}
//       <div className="tab-row">
//         <button
//           className={`tab ${mode === 'text' ? 'active' : ''}`}
//           onClick={() => setMode('text')}
//         >
//           Type Answer
//         </button>
//         <button
//           className={`tab ${mode === 'image' ? 'active' : ''}`}
//           onClick={() => setMode('image')}
//         >
//           Upload Image
//         </button>
//       </div>

//       {/* Text Mode */}
//       {mode === 'text' && (
//         <>
//           <label>Student Answer</label>
//           <textarea
//             placeholder="Type the student's answer here..."
//             value={answer}
//             onChange={(e) => setAnswer(e.target.value)}
//           />
//         </>
//       )}

//       {/* Image Mode */}
//       {mode === 'image' && (
//         <>
//           <label>Upload Answer Sheet Image</label>
//           <input
//             type="file"
//             accept="image/*"
//             onChange={(e) => setFile(e.target.files[0])}
//           />
//           {file && (
//             <p
//               style={{
//                 fontSize: '0.85rem',
//                 color: '#555',
//                 marginBottom: '16px',
//               }}
//             >
//               Selected: {file.name}
//             </p>
//           )}
//         </>
//       )}

//       {/* Error */}
//       {error && <div className="error">{error}</div>}

//       {/* Spinner */}
//       {loading && (
//         <div className="spinner-wrap">
//           <div className="spinner"></div>
//           <span>Evaluating answer, please wait...</span>
//         </div>
//       )}

//       {/* Submit */}
//       <button className="btn" onClick={handleSubmit} disabled={loading}>
//         {loading ? 'Evaluating...' : 'Submit Answer'}
//       </button>
//     </div>
//   );
// }

// export default Evaluate;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Evaluate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('text');
  const [answer, setAnswer] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [questions, setQuestions] = useState([]);
  const [questionId, setQuestionId] = useState('');
  const [loadingQuestions, setLoadingQ] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/questions/');
        setQuestions(res.data.questions || []);
        if (res.data.questions?.length > 0) {
          setQuestionId(res.data.questions[0].id);
        }
      } catch {
        setError('Could not load questions.');
      }
      setLoadingQ(false);
    };
    fetchQuestions();
  }, []);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      let response;

      if (mode === 'image') {
        // ── Batch route — evaluates all questions in image ──
        if (!file) {
          setError('Please upload an image.');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        response = await axios.post(
          'http://127.0.0.1:8000/evaluate/batch',
          formData,
        );
        navigate('/batch-results', { state: response.data });
      } else {
        // ── Single text evaluation ──
        if (!questionId) {
          setError('Please select a question.');
          setLoading(false);
          return;
        }
        if (!answer.trim()) {
          setError('Please enter an answer.');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('question_id', questionId);
        formData.append('answer', answer);
        response = await axios.post(
          'http://127.0.0.1:8000/evaluate/text',
          formData,
        );
        navigate('/results', { state: response.data });
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Something went wrong. Is the backend running?',
      );
    }

    setLoading(false);
  };

  const selectedQuestion = questions.find((q) => q.id === questionId);

  return (
    <div className="card">
      <h2>Evaluate Answer</h2>

      {/* Mode Toggle */}
      <div className="tab-row">
        <button
          className={`tab ${mode === 'text' ? 'active' : ''}`}
          onClick={() => setMode('text')}
        >
          Type Answer
        </button>
        <button
          className={`tab ${mode === 'image' ? 'active' : ''}`}
          onClick={() => setMode('image')}
        >
          Upload Answer Sheet
        </button>
      </div>

      {/* ── TEXT MODE: single question select ── */}
      {mode === 'text' && (
        <>
          <label>Select Question</label>
          {loadingQuestions ? (
            <p style={{ fontSize: '13px', color: '#888' }}>
              Loading questions...
            </p>
          ) : questions.length === 0 ? (
            <div className="error">
              No questions found. Go to{' '}
              <a href="/questions" style={{ color: '#e8342a' }}>
                Question Bank
              </a>{' '}
              first.
            </div>
          ) : (
            <select
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                marginBottom: '8px',
                outline: 'none',
                fontFamily: 'inherit',
                background: '#fff',
              }}
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  Q{q.question_number} — {q.question_text}
                </option>
              ))}
            </select>
          )}

          {selectedQuestion && (
            <div
              style={{
                background: '#fafafa',
                border: '1px solid #eee',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#555',
              }}
            >
              Max marks: <strong>{selectedQuestion.max_marks}</strong>
            </div>
          )}

          <label>Student Answer</label>
          <textarea
            placeholder="Type the student's answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </>
      )}

      {/* ── IMAGE MODE: full sheet batch ── */}
      {mode === 'image' && (
        <>
          <div
            style={{
              background: '#eef4ff',
              border: '1px solid #c8d8f8',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#4a7de8',
            }}
          >
            Upload the full answer sheet image. The system will detect Q1, Q2,
            Q3... automatically and evaluate each answer.
          </div>
          <label>Answer Sheet Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file && (
            <p
              style={{
                fontSize: '0.85rem',
                color: '#555',
                marginBottom: '16px',
              }}
            >
              Selected: {file.name}
            </p>
          )}
        </>
      )}

      {error && <div className="error">{error}</div>}

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner"></div>
          <span>
            {mode === 'image'
              ? 'Extracting and evaluating all answers...'
              : 'Evaluating answer...'}
          </span>
        </div>
      )}

      <button className="btn" onClick={handleSubmit} disabled={loading}>
        {loading
          ? 'Evaluating...'
          : mode === 'image'
            ? 'Evaluate Full Sheet'
            : 'Submit Answer'}
      </button>
    </div>
  );
}

export default Evaluate;
