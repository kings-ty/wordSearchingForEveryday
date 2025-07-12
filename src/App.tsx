import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // CSS 파일 불러오기
import NewLogo from './assets/new-logo.svg'; // ⭐ 로고 경로 확인

// import { GoogleLogin } from '@react-oauth/google';

interface DefinitionResponse {
  definition?: string[]; // 정의 (없을 수도 있음)
  synonyms?: string[];   // 동의어 (없을 수도 있음)
  examples?: string;  // 한글 번역 (없을 수도 있음)
  phonetics?: {
    text?: string; // 발음 기호 (없을 수도 있음)
    audio?: string; // 발음 오디오 URL (없을 수도 있음)
  }[]; // 발음 정보 배열 (없을 수도 있음)
}

// ⭐ 기능 모드를 정의하는 타입
type FeatureMode = 'word' | 'sentence';

function App() {
  const [word, setWord] = useState<string>('');
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [synonyms, setSynonyms] = useState<string[]>([]); // ⭐ synonyms addition
  const [examples, setExamples] = useState<string[]>([]); // ⭐ Examples addition
  const [phonetics, setPhonetics] = useState<{ text?: string; audio?: string }[]>([]); // ⭐ Phonetics addition
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [sentence, setSentence] = useState<string>('');
  const [correctionResult, setCorrectionResult] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null); // ⭐ 메시지 표시를 위한 상태

  // 현재 활성화된 기능 모드
  const [currentMode, setCurrentMode] = useState<FeatureMode>('word');
  const API_LANG_URL = 
  const showMessage = (msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage(null);
    }, duration);
  };
  // 단어 정의 및 번역 API 호출 함수
  const fetchDefinition = useCallback(async (text: string) => {
    if (!text) {
      setDefinitions([]);
      setSynonyms([]);
      setExamples([]);
      setPhonetics([]);
      return;
    }
    try {
      const response = await fetch(`${API_LANG_URL}/api/define`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: text }),
      });

      const data: DefinitionResponse = await response.json();

      setDefinitions(data.definition || []);
      setSynonyms(data.synonyms || []);
      // editting examples to handle array or string
      setExamples(data.examples && Array.isArray(data.examples) ? data.examples : []);
      setPhonetics(data.phonetics || []);

    } catch (error) {
      console.error('사전 API 호출 오류:', error);
      setDefinitions([]);
      setSynonyms([]);
    }
  }, []);

  // 문법 교정 API 호출 함수 (아직 백엔드 기능 없음, 프론트 UI만)
  const fetchCorrection = useCallback(async (text: string) => {
    if (!text) {
      setCorrectionResult('');
      return;
    }
    try {
      const response = await fetch(`${API_LANG_URL}/api/correctSentence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence: text }),
      });

      const data = await response.json();

      if (response.ok) {
        setCorrectionResult(data.correctedText || 'Can not find wrong sentence.');
      } else {
        setCorrectionResult(`오류: ${data.error || 'Unknown error occurred.'}`);
        console.error('문법 교정 API 오류 응답:', data);
      }

    } catch (error) {
      console.error('문법 교정 API 호출 오류:', error);
      setCorrectionResult('Correction failed. Please try again later.');
    }
  }, [API_LANG_URL]);


  // 단어 입력 시 디바운스 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentMode === 'word') {
        fetchDefinition(word);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [word, fetchDefinition, currentMode]);

  // 문장 입력 시 디바운스 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentMode === 'sentence') {
        fetchCorrection(sentence);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [sentence, fetchCorrection, currentMode]);


  // 노션 저장 핸들러
  // const handleSave = async () => {
  //   if (!word || definitions.length === 0) return;
  //   setIsSaving(true);
  //   try {
  //     const definitionText = definitions.join('\n');
  //     const synonymsText = (synonyms && synonyms.length > 0) ? synonyms.join(', ') : ''; 

  //     await fetch(`${API_WORD_URL}/api/save`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ word: word, definition: definitionText, synonyms: synonymsText }), 
  //     });
  //     alert('노션에 저장되었습니다!');
  //   } catch (error) {
  //     console.error('저장 API 호출 오류:', error);
  //     alert('저장에 실패했습니다.');
  //   }
  //   setIsSaving(false);
  // };

  const handleWordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
  };

  const handleSentenceInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSentence(e.target.value);
  };

  // 모드 전환 핸들러
  const handleModeChange = (mode: FeatureMode) => {
    setCurrentMode(mode);
    // 모드 전환 시 결과 초기화 (선택 사항)
    // setDefinitions([]);
    // setSynonyms([]);
    // setKoreanTranslation('');
    // setCorrectionResult('');
  };

  return (
    <div className="App">
      <header className="App-header">
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
                {/* <button onClick={handleSave} disabled={!definitions || definitions.length === 0} className="action-button primary-button">
                  {isSaving ? 'Saving...' : 'Save to Notion'}
                </button> */}
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

        {/* ⭐ 공통 결과 표시 영역 - 정의, 동의어, 번역 모두 표시 ⭐ */}
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
    </div>
  );
}

export default App;