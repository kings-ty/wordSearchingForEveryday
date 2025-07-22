// src/MainApp.tsx
import React, { useState, useEffect, useCallback } from 'react';
import './MainApp.css';
import NewLogo from './assets/new-logo.svg';

import { useUser } from './contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface DefinitionResponse {
  definition?: string[];
  synonyms?: string[];
  examples?: string | string[];
  phonetics?: {
    text?: string;
    audio?: string;
  }[];
}

const API_BASE_URL = 'http://localhost:8000';

type FeatureMode = 'word' | 'sentence';

function MainApp() {
  const { user, logoutUser } = useUser();
  const navigate = useNavigate();

  const [word, setWord] = useState<string>('');
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [examples, setExamples] = useState<string[]>([]);
  const [phonetics, setPhonetics] = useState<{ text?: string; audio?: string }[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [sentence, setSentence] = useState<string>('');
  const [correctionResult, setCorrectionResult] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);

  const [currentMode, setCurrentMode] = useState<FeatureMode>('word');

  const API_LANG_URL = API_BASE_URL;

  const showMessage = (msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage(null);
    }, duration);
  };

  const fetchDefinition = useCallback(async (text: string) => {
    if (!text) {
      setDefinitions([]);
      setSynonyms([]);
      setExamples([]);
      setPhonetics([]);
      return;
    }
    try {
      const response = await axios.post<DefinitionResponse>(`${API_LANG_URL}/api/define`, { word: text });
      const data = response.data;

      setDefinitions(data.definition || []);
      setSynonyms(data.synonyms || []);
      setExamples(data.examples && Array.isArray(data.examples) ? data.examples : (typeof data.examples === 'string' ? [data.examples] : []));
      setPhonetics(data.phonetics || []);

    } catch (error) {
      console.error('사전 API 호출 오류:', error);
      showMessage('단어 검색에 실패했습니다.');
      setDefinitions([]);
      setSynonyms([]);
      setExamples([]);
      setPhonetics([]);
    }
  }, [API_LANG_URL]);

  const fetchCorrection = useCallback(async (text: string) => {
    if (!text) {
      setCorrectionResult('');
      return;
    }
    try {
      const response = await axios.post(`${API_LANG_URL}/api/correctSentence`, { sentence: text });
      const data = response.data;

      if (response.status === 200) {
        setCorrectionResult(data.correctedText || 'Can not find wrong sentence.');
      } else {
        setCorrectionResult(`오류: ${data.error || 'Unknown error occurred.'}`);
        console.error('문법 교정 API 오류 응답:', data);
      }

    } catch (error) {
      console.error('문법 교정 API 호출 오류:', error);
      showMessage('문법 교정에 실패했습니다. 나중에 다시 시도해주세요.');
      setCorrectionResult('Correction failed. Please try again later.');
    }
  }, [API_LANG_URL]);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentMode === 'word') {
        fetchDefinition(word);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [word, fetchDefinition, currentMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentMode === 'sentence') {
        fetchCorrection(sentence);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [sentence, fetchCorrection, currentMode]);


  const handleSave = async () => {
    if (!word || definitions.length === 0) {
      showMessage('단어와 정의가 필요합니다.');
      return;
    }
    // 사용자가 Notion 연동이 되어있는지 확인
    // Notion access token과 함께 선택된 Notion Vocabulary DB ID가 모두 있는지 확인
    if (!user || !user.notionAccessToken || !user.notionVocabularyDbId || !user.notionUserId) {
      showMessage('Notion에 저장하려면 먼저 Notion과 연결하고 단어장을 선택해주세요.');
      navigate('/login'); // 로그인 페이지로 이동하여 Notion 연결 유도
      return;
    }

    setIsSaving(true);
    try {
      const definitionText = definitions.join('\n');
      const synonymsText = (synonyms && synonyms.length > 0) ? synonyms.join(', ') : '';

      // FastAPI의 save-to-notion 엔드포인트 호출
      const response = await axios.post(`${API_BASE_URL}/api/notion/save-to-notion`, {
        word: word,
        definition: definitionText,
        synonyms: synonymsText,
        user_id: user.notionUserId, // Notion 사용자 ID를 전달하여 백엔드에서 토큰과 DB ID 조회
      });

      console.log('노션 저장 응답:', response.data);
      showMessage('노션에 저장되었습니다!');
    } catch (error) {
      console.error('노션 저장 API 호출 오류:', error);
      showMessage('노션 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
  };

  const handleSentenceInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSentence(e.target.value);
  };

  const handleModeChange = (mode: FeatureMode) => {
    setCurrentMode(mode);
  };

  const handleLogout = () => {
    logoutUser();
    showMessage('로그아웃 되었습니다.');
    navigate('/login');
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* 사용자 정보 섹션 - 오른쪽 상단 */}
        <div className="user-info-section">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleLogout}>
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt="User Avatar"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
                />
              )}
              <span style={{ color: 'white', fontWeight: 'bold' }}>{user.name}</span>
              <span style={{ color: 'gray', marginLeft: '5px' }}>(로그아웃)</span>
            </div>
          ) : (
            <button className="login-prompt-button" onClick={() => navigate('/login')}>로그인/Notion 연결</button>
          )}
        </div>

        {/* 로고와 제목 섹션 */}
        <div className="App-title-container">
          <img src={NewLogo} className="App-logo" alt="logo" />
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Grammar & Word Corrector</h1>
          <p className="text-gray-600 text-center">Your AI-powered linguistic assistant.</p>
        </div>

        {/* 기능 모드 선택 탭 */}
        <div className="feature-tabs">
          <button
            className={`tab-button ${currentMode === 'word' ? 'active' : ''}`}
            onClick={() => handleModeChange('word')}
          >
            Word searching
          </button>
          <button
            className={`tab-button ${currentMode === 'sentence' ? 'active' : ''}`}
            onClick={() => handleModeChange('sentence')}
          >
            Grammer correction
          </button>
        </div>

        {/* 기능 모드에 따른 조건부 렌더링 */}
        <div className="feature-content-wrapper">
          {currentMode === 'word' && (
            <section className="input-section word-section active-section">
              <div className="input-group">
                <input
                  type="text"
                  value={word}
                  onChange={handleWordInputChange}
                  placeholder="Writing a word to search"
                  className="input-field"
                />
                {/* 노션 저장 버튼 - 사용자 로그인 및 Notion 연결 시에만 표시 */}
                {user && user.notionAccessToken && user.notionVocabularyDbId && (
                  <button
                    onClick={handleSave}
                    disabled={!word || definitions.length === 0 || isSaving}
                    className="action-button primary-button"
                  >
                    {isSaving ? 'Saving...' : 'Save to Notion'}
                  </button>
                )}
              </div>
            </section>
          )}

          {currentMode === 'sentence' && (
            <section className="input-section sentence-section active-section">
              <div className="input-group">
                <textarea
                  value={sentence}
                  onChange={handleSentenceInputChange}
                  placeholder="Writing a sentence to correct (max 500 characters)"
                  maxLength={500}
                  rows={5}
                  className="input-field textarea-field"
                />
                <button className="action-button secondary-button" disabled={!sentence}>
                  Correct Sentence
                </button>
              </div>
            </section>
          )}
        </div> {/* feature-content-wrapper 끝 */}

        {/* 공통 결과 표시 영역 */}
        <div className="result-box common-result-box">
          {currentMode === 'word' && (
            <>
              {definitions && definitions.length > 0 && (
                <div className="definition-section">
                  <h3>Definition:</h3>
                  <ul>
                    {definitions.map((def, index) => (
                      <li key={index}>{def}</li>
                    ))}
                  </ul>
                </div>
              )}

              {synonyms && synonyms.length > 0 && (
                <div className="synonym-section">
                  <h3>Synonym:</h3>
                  <p>{synonyms.join(', ')}</p>
                </div>
              )}

              {examples && examples.length > 0 && (
                <div className="example-section">
                  <h3>Examples:</h3>
                  <ul>
                    {examples.map((ex, index) => (
                      <li key={index}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}

              {phonetics && phonetics.length > 0 && (
                <div className="phonetics-section">
                  <h3>Phonetics:</h3>
                  <ul>
                    {phonetics.map((p, index) => (
                      <li key={index}>
                        {p.text}
                        {p.audio && (
                          <audio controls>
                            <source src={p.audio} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(!definitions || definitions.length === 0) &&
                (!synonyms || synonyms.length === 0) &&
                (!examples || examples.length === 0) &&
                (!phonetics || phonetics.length === 0) && (
                  <p className="placeholder-text">Searching Result.</p>
                )}
            </>
          )}

          {currentMode === 'sentence' && (
            correctionResult ? (
              <p>{correctionResult}</p>
            ) : (
              <p className="placeholder-text">Correcting Result.</p>
            )
          )}
        </div>
      </header>
      {message && (
        <div className="message-overlay">
          <div className="message-box">
            <p>{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainApp;
