import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Botao from '../components/Botao';
import Input from '../components/Input';
import { useAuth } from '../hooks/useAuth';
import { extrairErro } from '../services/api';

export default function Login() {
  const { login, autenticado } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (autenticado) {
    return <Navigate to="/menu" replace />;
  }

  function validar() {
    const novos = {};
    const usuario = form.username.trim();
    if (usuario.length < 3 || usuario.length > 50) {
      novos.username = 'Use de 3 a 50 caracteres.';
    } else if (/\s/.test(usuario)) {
      novos.username = 'Não pode conter espaços.';
    }
    if (form.password.length < 6) {
      novos.password = 'A senha precisa ter ao menos 6 caracteres.';
    }
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErroGeral('');
    if (!validar()) return;

    setEnviando(true);
    try {
      await login(form.username.trim(), form.password);
      navigate('/menu', { replace: true });
    } catch (error) {
      setErroGeral(extrairErro(error, 'Não foi possível entrar.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="animate-slide-up text-center">
        <div aria-hidden="true" className="mb-4 text-5xl">
          ✝
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight text-texto sm:text-4xl">
          Adivinhação Bíblica
        </h1>
        <p className="mt-2 text-texto-suave">Teste seus conhecimentos</p>
      </div>

      <form onSubmit={enviar} noValidate className="animate-fade-in mt-8 flex flex-col gap-4">
        {erroGeral && (
          <div
            role="alert"
            className="rounded-xl border border-erro/40 bg-erro/10 px-4 py-3 text-sm text-erro"
          >
            {erroGeral}
          </div>
        )}

        <Input
          label="Nome de usuário"
          type="text"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          placeholder="seu_usuario"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          erro={erros.username}
        />

        <Input
          label="Senha"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          erro={erros.password}
        />

        <Botao type="submit" tamanho="lg" carregando={enviando} className="mt-2 w-full">
          Entrar
        </Botao>

        <p className="mt-2 text-center text-sm text-texto-suave">
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-primaria hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
