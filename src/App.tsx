import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// API 응답 형태를 미리 정의해두면 더 안전합니다.
interface TranslationResponse {
  translatedText: string;
}

function App() {
  // useState에 <string>, <boolean> 과 같은 타입을 지정해줍니다.
  const [word, setWord] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 함수 파라미터에도 타입을 지정합니다 (text: string)
  const fetchTranslation = useCallback(async (text: string) => {
    if (!text) {
      setTranslatedText('');
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      // 응답 데이터의 타입을 위에서 정의한 형태로 지정합니다.
      const data: TranslationResponse = await response.json();
      setTranslatedText(data.translatedText);
    } catch (error) {
      console.error('번역 API 호출 오류:', error);
      setTranslatedText('번역 실패');
    }
  }, []);

  // 입력이 멈춘 후 500ms 뒤에 번역 요청 (로직은 동일)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTranslation(word);
    }, 500);

    return () => clearTimeout(timer);
  }, [word, fetchTranslation]);

  const handleSave = async () => {
    if (!word || !translatedText) return;
    setIsSaving(true);
    try {
      await fetch('http://localhost:3001/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, translation: translatedText }),
      });
      alert('노션에 저장되었습니다!');
    } catch (error) {
      console.error('노션 저장 API 호출 오류:', error);
      alert('저장에 실패했습니다.');
    }
    setIsSaving(false);
  };
  
  // input의 onChange 이벤트(e)에도 타입을 지정해줍니다.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>실시간 단어 번역 및 저장 (TypeScript Ver.)</h1>
        <div className="input-container">
          <input
            type="text"
            value={word}
            onChange={handleInputChange}
            placeholder="영단어를 입력하세요"
          />
          <button onClick={handleSave} disabled={isSaving || !word}>
            {isSaving ? '저장 중...' : '노션에 저장'}
          </button>
        </div>
        <div className="translation-result">
          <p>{translatedText || '번역 결과가 여기에 표시됩니다.'}</p>
        </div>
      </header>
    </div>
  );
}

export default App;