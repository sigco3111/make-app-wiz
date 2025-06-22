
import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { KeyIcon, CheckCircleIcon, InformationCircleIcon, LockClosedIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface PersistentApiKeySectionProps {
  envKeyIsSet: boolean;
  currentLocalKey: string | null;
  onUpdateLocalKey: (newKey: string) => void;
  isAppUsable: boolean;
}

export const PersistentApiKeySection: React.FC<PersistentApiKeySectionProps> = ({
  envKeyIsSet,
  currentLocalKey,
  onUpdateLocalKey,
  isAppUsable,
}) => {
  const [inputKeyValue, setInputKeyValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // We don't pre-fill password fields for security/UX reasons.
  }, [currentLocalKey]);

  const handleSaveLocalKey = () => {
    if (!inputKeyValue.trim()) {
      setError('API 키를 입력해주세요.');
      setSuccessMessage(null);
      return;
    }
    setError(null);
    onUpdateLocalKey(inputKeyValue);
    setSuccessMessage('로컬 API 키가 성공적으로 저장되었습니다.');
    setInputKeyValue(''); 
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="bg-slate-200 dark:bg-slate-800 p-3 shadow-md sticky top-0 z-50 border-b border-slate-300 dark:border-slate-700" role="region" aria-label="API 키 관리">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-2">
            <div className="flex items-center text-slate-700 dark:text-slate-300 text-sm">
                {envKeyIsSet ? (
                    <>
                        <LockClosedIcon className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" aria-hidden="true" />
                        <span>환경 변수 API 키 사용 중 (가장 높은 우선 순위).</span>
                    </>
                ) : currentLocalKey ? (
                    <>
                        <KeyIcon className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                        <span>로컬 저장소 API 키 사용 중.</span>
                    </>
                ) : (
                    <>
                        <ShieldExclamationIcon className="h-5 w-5 mr-2 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
                        <span>API 키 필요: 로컬 키를 입력하세요.</span>
                    </>
                )}
            </div>
            
            <div className="flex items-center text-xs">
                {isAppUsable ? (
                    <span className="flex items-center px-2 py-0.5 rounded-full bg-green-500 dark:bg-green-600 text-white dark:text-green-100">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        API 키 활성
                    </span>
                ) : (
                    <span className="flex items-center px-2 py-0.5 rounded-full bg-red-500 dark:bg-red-600 text-white dark:text-red-100" role="alert">
                        <InformationCircleIcon className="h-4 w-4 mr-1" />
                        API 키 비활성 - 기능 제한
                    </span>
                )}
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <Input
            type="password"
            value={inputKeyValue}
            onChange={(e) => { setInputKeyValue(e.target.value); setError(null); setSuccessMessage(null); }}
            placeholder={envKeyIsSet ? "환경 변수 키 사용 중 (로컬 키 변경 가능)" : (currentLocalKey ? "새 로컬 API 키 입력 (덮어쓰기)" : "로컬 API 키 입력")}
            className="text-sm py-1.5 flex-grow" // Input component itself handles dark mode
            aria-label="로컬 API 키 입력"
            aria-describedby="api-key-status-message local-key-info"
          />
          <Button 
            onClick={handleSaveLocalKey} 
            size="sm" 
            variant="primary" 
            className="sm:w-auto w-full whitespace-nowrap flex-shrink-0" // Button handles dark mode
            leftIcon={<CheckCircleIcon className="h-4 w-4" />}
          >
            로컬 키 저장
          </Button>
        </div>
        <p id="local-key-info" className="text-xs text-slate-600 dark:text-slate-500 mt-1">
            {envKeyIsSet 
                ? "환경 변수 키가 설정되어 있어 우선 사용됩니다. 로컬 키는 환경 변수 키가 없을 때 사용되거나, 다음 앱 로드 시 사용될 수 있습니다."
                : "로컬 키는 브라우저 저장소에 저장됩니다. 환경 변수(process.env.API_KEY)에 키가 설정되면 해당 키가 우선적으로 사용됩니다."
            }
        </p>
        
        {(error || successMessage) && (
            <div id="api-key-status-message" className="text-xs text-center mt-1" aria-live="polite">
            {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
            {successMessage && <p className="text-green-600 dark:text-green-400">{successMessage}</p>}
            </div>
        )}
      </div>
    </div>
  );
};
