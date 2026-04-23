// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// function Evaluate() {
//   const navigate = useNavigate();

//   const [mode, setMode] = useState('text');
//   const [answer, setAnswer] = useState('');
//   //const [file, setFile] = useState([]);
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [feedbackMode, setFeedbackMode] = useState('ollama');

//   const [ocrText, setOcrText] = useState('');
//   const [showPreview, setShowPreview] = useState(false);

//   const [questions, setQuestions] = useState([]);
//   const [questionId, setQuestionId] = useState('');
//   const [loadingQuestions, setLoadingQ] = useState(true);

//   useEffect(() => {
//     const fetchQuestions = async () => {
//       try {
//         const res = await axios.get('http://127.0.0.1:8000/questions/');
//         setQuestions(res.data.questions || []);

//         if (res.data.questions?.length > 0) {
//           setQuestionId(res.data.questions[0].id);
//         }
//       } catch {
//         setError('Could not load questions.');
//       }

//       setLoadingQ(false);
//     };

//     fetchQuestions();
//   }, []);

//   const handleSubmit = async () => {
//     setError('');
//     setLoading(true);

//     try {
//       let response;

//       if (mode === 'image') {
//         if (!file || file.length === 0) {
//           setError('Please upload at least one image.');
//           setLoading(false);
//           return;
//         }

//         const formData = new FormData();

//         for (let i = 0; i < file.length; i++) {
//           formData.append('files', file[i]);
//         }

//         const previewRes = await axios.post(
//           'http://127.0.0.1:8000/evaluate/preview',
//           formData,
//         );

//         setOcrText(previewRes.data.text);
//         setShowPreview(true);
//         setLoading(false);
//         return;
//       } else {
//         if (!questionId) {
//           setError('Please select a question.');
//           setLoading(false);
//           return;
//         }

//         if (!answer.trim()) {
//           setError('Please enter an answer.');
//           setLoading(false);
//           return;
//         }

//         const formData = new FormData();
//         formData.append('question_id', questionId);
//         formData.append('answer', answer);
//         formData.append('feedback_mode', feedbackMode);

//         response = await axios.post(
//           'http://127.0.0.1:8000/evaluate/text',
//           formData,
//         );

//         navigate('/results', { state: response.data });
//       }
//     } catch (err) {
//       setError(
//         err.response?.data?.detail ||
//           'Something went wrong. Is the backend running?',
//       );
//     }

//     setLoading(false);
//   };

//   // ✅ FIXED FUNCTION
//   const handleFinalEvaluation = async () => {
//     setLoading(true);
//     setError('');

//     try {
//       const formData = new FormData();

//       // Send original uploaded files again
//       for (let i = 0; i < file.length; i++) {
//         formData.append('files', file[i]);
//       }

//       formData.append('feedback_mode', feedbackMode);

//       const res = await axios.post(
//         'http://127.0.0.1:8000/evaluate/batch',
//         formData,
//       );

//       navigate('/batch-results', { state: res.data });
//     } catch (err) {
//       setError(
//         typeof err.response?.data?.detail === 'string'
//           ? err.response.data.detail
//           : 'Evaluation failed.',
//       );
//     }

//     setLoading(false);
//   };

//   const selectedQuestion = questions.find((q) => q.id === questionId);

//   return (
//     <div className="card">
//       <h2>Evaluate Answer</h2>

//       <div className="tab-row">
//         <button
//           className={`tab ${mode === 'text' ? 'active' : ''}`}
//           onClick={() => {
//             setMode('text');
//             setShowPreview(false);
//           }}
//         >
//           Type Answer
//         </button>

//         <button
//           className={`tab ${mode === 'image' ? 'active' : ''}`}
//           onClick={() => setMode('image')}
//         >
//           Upload Answer Sheet
//         </button>
//       </div>

//       {mode === 'text' && (
//         <>
//           <label>Select Question</label>

//           {loadingQuestions ? (
//             <p style={{ fontSize: '13px', color: '#888' }}>
//               Loading questions...
//             </p>
//           ) : questions.length === 0 ? (
//             <div className="error">
//               No questions found. Go to{' '}
//               <a href="/questions" style={{ color: '#e8342a' }}>
//                 Question Bank
//               </a>{' '}
//               first.
//             </div>
//           ) : (
//             <select
//               value={questionId}
//               onChange={(e) => setQuestionId(e.target.value)}
//               style={{
//                 width: '100%',
//                 padding: '10px 14px',
//                 fontSize: '14px',
//                 border: '1px solid #ddd',
//                 borderRadius: '10px',
//                 marginBottom: '8px',
//                 outline: 'none',
//                 fontFamily: 'inherit',
//                 background: '#fff',
//               }}
//             >
//               {questions.map((q) => (
//                 <option key={q.id} value={q.id}>
//                   Q{q.question_number} — {q.question_text}
//                 </option>
//               ))}
//             </select>
//           )}

//           {selectedQuestion && (
//             <div
//               style={{
//                 background: '#fafafa',
//                 border: '1px solid #eee',
//                 borderRadius: '10px',
//                 padding: '12px 16px',
//                 marginBottom: '20px',
//                 fontSize: '13px',
//                 color: '#555',
//               }}
//             >
//               Max marks: <strong>{selectedQuestion.max_marks}</strong>
//             </div>
//           )}

//           <label>Student Answer</label>

//           <textarea
//             placeholder="Type the student's answer here..."
//             value={answer}
//             onChange={(e) => setAnswer(e.target.value)}
//           />
//         </>
//       )}

//       {mode === 'image' && (
//         <>
//           <div
//             style={{
//               background: '#eef4ff',
//               border: '1px solid #c8d8f8',
//               borderRadius: '10px',
//               padding: '14px 16px',
//               marginBottom: '20px',
//               fontSize: '13px',
//               color: '#4a7de8',
//             }}
//           >
//             Upload multiple pages of the same student answer sheet. OCR text
//             will be extracted first, then you can review it before final
//             evaluation.
//           </div>

//           <label>Answer Sheet Pages</label>

//           <input
//             type="file"
//             accept="image/*"
//             multiple
//             onChange={(e) => {
//               setFile(e.target.files);
//               setShowPreview(false);
//               setOcrText('');
//             }}
//           />

//           {file && file.length > 0 && (
//             <p
//               style={{
//                 fontSize: '0.85rem',
//                 color: '#555',
//                 marginBottom: '16px',
//               }}
//             >
//               Selected: {file.length} page(s)
//             </p>
//           )}

//           {showPreview && (
//             <>
//               <label>OCR Extracted Text (Preview)</label>

//               <textarea
//                 value={ocrText}
//                 readOnly
//                 style={{ minHeight: '220px' }}
//               />

//               <button
//                 className="btn"
//                 onClick={handleFinalEvaluation}
//                 disabled={loading}
//                 style={{ marginTop: '12px' }}
//               >
//                 Evaluate Answer Sheet
//               </button>
//             </>
//           )}
//         </>
//       )}

//       {error && <div className="error">{error}</div>}

//       {loading && (
//         <div className="spinner-wrap">
//           <div className="spinner"></div>
//           <span>
//             {mode === 'image'
//               ? showPreview
//                 ? 'Evaluating answer sheet...'
//                 : 'Extracting OCR from pages...'
//               : 'Evaluating answer...'}
//           </span>
//         </div>
//       )}

//       <label style={{ marginTop: '16px' }}>Feedback Engine</label>

//       <select
//         value={feedbackMode}
//         onChange={(e) => setFeedbackMode(e.target.value)}
//         style={{
//           width: '100%',
//           padding: '10px 14px',
//           fontSize: '14px',
//           border: '1px solid #ddd',
//           borderRadius: '10px',
//           marginBottom: '16px',
//           outline: 'none',
//           background: '#fff',
//         }}
//       >
//         <option value="ollama">Local (Ollama)</option>
//         <option value="openai">OpenAI (Faster)</option>
//       </select>

//       {!showPreview && (
//         <button className="btn" onClick={handleSubmit} disabled={loading}>
//           {loading
//             ? 'Processing...'
//             : mode === 'image'
//               ? 'Preview OCR Text'
//               : 'Submit Answer'}
//         </button>
//       )}
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
  const [feedbackMode, setFeedbackMode] = useState('ollama');

  const [ocrText, setOcrText] = useState('');
  const [showPreview, setShowPreview] = useState(false);

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
        if (!file || file.length === 0) {
          setError('Please upload at least one image.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        file.forEach((f) => formData.append('files', f));

        const previewRes = await axios.post(
          'http://127.0.0.1:8000/evaluate/preview',
          formData,
        );

        setOcrText(previewRes.data.text);
        setShowPreview(true);
        setLoading(false);
        return;
      } else {
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
        formData.append('feedback_mode', feedbackMode);

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

  const handleFinalEvaluation = async () => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      file.forEach((f) => formData.append('files', f));
      formData.append('feedback_mode', feedbackMode);

      const res = await axios.post(
        'http://127.0.0.1:8000/evaluate/batch',
        formData,
      );

      navigate('/batch-results', { state: res.data });
    } catch (err) {
      setError(
        typeof err.response?.data?.detail === 'string'
          ? err.response.data.detail
          : 'Evaluation failed.',
      );
    }

    setLoading(false);
  };

  // Remove a single file from the list
  const handleRemoveFile = (index) => {
    const updated = file.filter((_, i) => i !== index);
    setFile(updated.length > 0 ? updated : null);
    setShowPreview(false);
    setOcrText('');
  };

  const selectedQuestion = questions.find((q) => q.id === questionId);

  return (
    <div className="card">
      <h2>Evaluate Answer</h2>

      <div className="tab-row">
        <button
          className={`tab ${mode === 'text' ? 'active' : ''}`}
          onClick={() => {
            setMode('text');
            setShowPreview(false);
          }}
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
            Upload pages one by one or all at once. Each upload adds to the list
            — no need to hold Ctrl.
          </div>

          <label>Answer Sheet Pages</label>

          <input
            type="file"
            accept="image/*"
            multiple
            onClick={(e) => {
              e.target.value = null;
            }}
            onChange={(e) => {
              const newFiles = Array.from(e.target.files);
              if (newFiles.length > 0) {
                // ACCUMULATE: merge new files with existing list
                setFile((prev) => (prev ? [...prev, ...newFiles] : newFiles));
              }
              setShowPreview(false);
              setOcrText('');
            }}
          />

          {file && file.length > 0 && (
            <div
              style={{
                fontSize: '0.85rem',
                color: '#555',
                marginBottom: '16px',
                marginTop: '8px',
              }}
            >
              <strong>{file.length} page(s) selected:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                {file.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    {f.name}
                    <button
                      onClick={() => handleRemoveFile(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#e8342a',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '0',
                        lineHeight: '1',
                      }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showPreview && (
            <>
              <label>OCR Extracted Text (Preview)</label>

              <textarea
                value={ocrText}
                readOnly
                style={{ minHeight: '220px' }}
              />

              <button
                className="btn"
                onClick={handleFinalEvaluation}
                disabled={loading}
                style={{ marginTop: '12px' }}
              >
                Evaluate Answer Sheet
              </button>
            </>
          )}
        </>
      )}

      {error && <div className="error">{error}</div>}

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner"></div>
          <span>
            {mode === 'image'
              ? showPreview
                ? 'Evaluating answer sheet...'
                : 'Extracting OCR from pages...'
              : 'Evaluating answer...'}
          </span>
        </div>
      )}

      <label style={{ marginTop: '16px' }}>Feedback Engine</label>

      <select
        value={feedbackMode}
        onChange={(e) => setFeedbackMode(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: '14px',
          border: '1px solid #ddd',
          borderRadius: '10px',
          marginBottom: '16px',
          outline: 'none',
          background: '#fff',
        }}
      >
        <option value="ollama">Local (Ollama)</option>
        <option value="openai">OpenAI (Faster)</option>
      </select>

      {!showPreview && (
        <button className="btn" onClick={handleSubmit} disabled={loading}>
          {loading
            ? 'Processing...'
            : mode === 'image'
              ? 'Preview OCR Text'
              : 'Submit Answer'}
        </button>
      )}
    </div>
  );
}

export default Evaluate;
