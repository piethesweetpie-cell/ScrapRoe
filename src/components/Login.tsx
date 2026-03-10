import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6 text-center">관리자 로그인</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            required
            autoFocus
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[#FF66C4] transition-colors text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[#FF66C4] transition-colors text-sm"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#FF66C4] text-white rounded-xl font-bold hover:bg-[#ff4d94] transition-all disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <button onClick={onClose} className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          취소
        </button>
      </div>
    </div>
  );
}
