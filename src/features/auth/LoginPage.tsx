import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { login } from '../../api/auth.api';
import { getApiErrorMessage } from '../../api/httpClient';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Toast } from '../../components/Toast';
import { useAuthStore } from './auth.store';
import justWaveLogo from '../../../onw.png';

export function LoginPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      setSession(data.access_token, data.user);
      navigate('/walk-in', { replace: true });
    }
  });

  if (token) return <Navigate to="/walk-in" replace />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-art">
          <img src={justWaveLogo} alt="JustWave" />
        </div>
        <form className="form-stack" onSubmit={onSubmit}>
          <header className="page-header">
            <p>Staff login</p>
            <h2>Start desk session</h2>
          </header>
          {mutation.isError ? <Toast tone="error">{getApiErrorMessage(mutation.error)}</Toast> : null}
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in...' : 'Login'}
          </Button>
        </form>
      </section>
    </main>
  );
}
