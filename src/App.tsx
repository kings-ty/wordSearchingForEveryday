import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // CSS 파일 불러오기
import NewLogo from './assets/new-logo.svg'; // ⭐ 로고 경로 확인

interface DefinitionResponse {
  definition?: string[]; // 정의 (없을 수도 있음)
  synonyms?: string[];   // 동의어 (없을 수도 있음)
  translation?: string;  // 한글 번역 (없을 수도 있음)
}

// ⭐ 기능 모드를 정의하는 타입
type FeatureMode = 'word' | 'sentence';

function App() {
  const [word, setWord] = useState<string>('');
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [synonyms, setSynonyms] = useState<string[]>([]); // ⭐ synonyms 상태 추가
  const [koreanTranslation, setKoreanTranslation] = useState<string>(''); // ⭐ 한글 번역 상태 추가
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [sentence, setSentence] = useState<string>('');
  const [correctionResult, setCorrectionResult] = useState<string>('');

  // 현재 활성화된 기능 모드
  const [currentMode, setCurrentMode] = useState<FeatureMode>('word');

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // 단어 정의 및 번역 API 호출 함수
  const fetchDefinition = useCallback(async (text: string) => {
    if (!text) {
      setDefinitions([]);
      setSynonyms([]);
      setKoreanTranslation(''); // ⭐ 초기화
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/define`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: text }),
      });

      const data: DefinitionResponse = await response.json();

      setDefinitions(data.definition || []);
      setSynonyms(data.synonyms || []);
      setKoreanTranslation(data.translation || ''); // ⭐ 번역 결과 상태 업데이트

    } catch (error) {
      console.error('사전 API 호출 오류:', error);
      setDefinitions([]);
      setSynonyms([]);
      setKoreanTranslation(''); // ⭐ 에러 시 초기화
    }
  }, [API_BASE_URL]);

  // 문법 교정 API 호출 함수 (아직 백엔드 기능 없음, 프론트 UI만)
  const fetchCorrection = useCallback(async (text: string) => {
    if (!text) {
      setCorrectionResult('');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/correctSentence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence: text }),
      });

      const data = await response.json();

      if (response.ok) {
        setCorrectionResult(data.correctedText || '교정 결과를 찾을 수 없습니다.');
      } else {
        setCorrectionResult(`오류: ${data.error || '알 수 없는 오류'}`);
        console.error('문법 교정 API 오류 응답:', data);
      }

    } catch (error) {
      console.error('문법 교정 API 호출 오류:', error);
      setCorrectionResult('문장 교정 중 오류가 발생했습니다.');
    }
  }, [API_BASE_URL]);


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
  const handleSave = async () => {
    if (!word || definitions.length === 0) return;
    setIsSaving(true);
    try {
      const definitionText = definitions.join('\n');
      const synonymsText = (synonyms && synonyms.length > 0) ? synonyms.join(', ') : ''; 

      await fetch(`${API_BASE_URL}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word, definition: definitionText, synonyms: synonymsText }), 
      });
      alert('노션에 저장되었습니다!');
    } catch (error) {
      console.error('저장 API 호출 오류:', error);
      alert('저장에 실패했습니다.');
    }
    setIsSaving(false);
  };

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
          <h1 className="App-main-title">Grammar & Word Perfector</h1>
          <p className="App-subtitle">Your AI-powered linguistic assistant.</p>
        </div>

        {/* 기능 모드 선택 탭 */}
        <div className="feature-tabs">
          <button
            className={`tab-button ${currentMode === 'word' ? 'active' : ''}`}
            onClick={() => handleModeChange('word')}
          >
            단어 검색 & 저장
          </button>
          <button
            className={`tab-button ${currentMode === 'sentence' ? 'active' : ''}`}
            onClick={() => handleModeChange('sentence')}
          >
            문법 & 문장 교정
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
                  placeholder="영단어를 입력하세요"
                  className="input-field"
                />
                <button onClick={handleSave} disabled={!definitions || definitions.length === 0} className="action-button primary-button">
                  {isSaving ? '저장 중...' : '노션에 저장'}
                </button>
              </div>
            </section>
          )}

          {currentMode === 'sentence' && (
            <section className="input-section sentence-section active-section">
              <div className="input-group">
                <textarea
                  value={sentence}
                  onChange={handleSentenceInputChange}
                  placeholder="교정할 문장을 입력하세요"
                  rows={5}
                  className="input-field textarea-field"
                />
                <button className="action-button secondary-button" disabled={!sentence}>
                  문장 교정
                </button>
              </div>
            </section>
          )}
        </div> {/* feature-content-wrapper 끝 */}

        {/* ⭐ 공통 결과 표시 영역 - 정의, 동의어, 번역 모두 표시 ⭐ */}
        <div className="result-box common-result-box">
          {currentMode === 'word' && (
            <> {/* 여러 요소를 묶기 위해 Fragment 사용 */}
              {koreanTranslation && ( // ⭐ 한글 번역이 있을 때만 표시
                <div className="translation-section">
                  <h3>한글 번역:</h3>
                  <p>{koreanTranslation}</p>
                </div>
              )}

              {definitions && definitions.length > 0 && ( // ⭐ 정의가 있을 때만 표시
                <div className="definition-section">
                  <h3>정의:</h3>
                  <ul>
                    {definitions.map((def, index) => (
                      <li key={index}>{def}</li>
                    ))}
                  </ul>
                </div>
              )}

              {synonyms && synonyms.length > 0 && ( // ⭐ 동의어가 있을 때만 표시
                <div className="synonym-section">
                  <h3>동의어:</h3>
                  <p>{synonyms.join(', ')}</p> {/* 쉼표로 연결하여 표시 */}
                </div>
              )}

              {/* 모든 결과가 없을 때만 placeholder 표시 */}
              {(!koreanTranslation && (!definitions || definitions.length === 0) && (!synonyms || synonyms.length === 0)) && (
                  <p className="placeholder-text">사전 검색 결과가 여기에 표시됩니다.</p>
              )}
            </>
          )}
          {currentMode === 'sentence' && (
            correctionResult ? (
              <p>{correctionResult}</p>
            ) : (
              <p className="placeholder-text">교정 결과가 여기에 표시됩니다.</p>
            )
          )}
        </div>
      </header>
    </div>
  );
}

export default App;