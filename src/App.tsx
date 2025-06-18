import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

interface DefinitionResponse {
  definition: string[]; // 이전 답변에 따라 단수형으로 수정했다고 가정
}

function App() {
  const [word, setWord] = useState<string>('');
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchDefinition = useCallback(async (text: string) => {
    if (!text) {
      setDefinitions([]);
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: text }),
      });

      const data: DefinitionResponse = await response.json();
      
      // --- 디버깅 로그 2 ---
      console.log('2. API에서 받은 raw data:', data);

      // --- 디버깅 로그 3 ---
      console.log('3. setDefinitions에 넣을 값:', data.definition);

      setDefinitions(data.definition);

    } catch (error) {
      console.error('사전 API 호출 오류:', error);
      setDefinitions([]); // 에러 발생 시 빈 배열로 초기화
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDefinition(word);
    }, 500);
    return () => clearTimeout(timer);
  }, [word, fetchDefinition]);

  const handleSave = async () => {
    if (!word || definitions.length === 0) return;
    setIsSaving(true);
    try {
      const definitionText = definitions.join('\n');
      await fetch('http://localhost:3001/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word, definition: definitionText }),
      });
      alert('노션에 저장되었습니다!');
    } catch (error) {
      alert('저장에 실패했습니다.');
    }
    setIsSaving(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
  };

  // --- 디버깅 로그 1 ---
  console.log('1. 렌더링 직전 definitions 상태:', definitions);

  return (
    <div className="App">
      {/* ... JSX 부분은 동일 ... */}
      <header className="App-header">
        <h1>실시간 단어 번역 및 저장 (TypeScript Ver.)</h1>
        <div className="input-container">
          <input
            type="text"
            value={word}
            onChange={handleInputChange}
            placeholder="영단어를 입력하세요"
          />
          <button onClick={handleSave} disabled={!definitions || definitions.length === 0}>
            {isSaving ? '저장 중...' : '노션에 저장'}
          </button>
        </div>
        <div className="translation-result">
          {definitions && definitions.length > 0 ? (
            <ul>
              {definitions.map((def, index) => (
                <li key={index}>{def}</li>
              ))}
            </ul>
          ) : (
            <p>사전 검색 결과가 여기에 표시됩니다.</p>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;